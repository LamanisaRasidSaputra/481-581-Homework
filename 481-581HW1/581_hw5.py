import numpy as np
import matplotlib.pyplot as plt
import time
import imageio.v2 as imageio
from scipy.fftpack import fft, fft2, ifft2
from scipy.integrate import solve_ivp
from scipy.linalg import solve, solve_triangular, lu
from scipy.sparse.linalg import bicgstab
from scipy.sparse import spdiags

#============================PART A=========================================

#+++++++++++++++ 1. Parameters
tspan = np.arange(0, 4.5, 0.5)
nu = 0.001
Lx, Ly = 20, 20
nx, ny = 64, 64
N = nx * ny

#+++++++++++++++  2. Define spatial domain and initial conditions
x2 = np.linspace(-Lx/2, Lx/2, nx + 1)
x = x2[:nx]
y2 = np.linspace(-Ly/2, Ly/2, ny + 1)
y = y2[:ny]
X, Y = np.meshgrid(x, y)

w1 = (np.exp((-(X+0)**2 - ((Y+0)**2) / 20))).flatten()
# w2 = -1 * (np.exp((-(X-0)**2 - ((Y+3)**2) / 20))).flatten()
# w = w1+w2

#+++++++++++++++  3. Define spectral k values
kx = (2 * np.pi / Lx) * np.concatenate((np.arange(0, nx/2), np.arange(-nx/2, 0)))
kx[0] = 1e-6
ky = (2 * np.pi / Ly) * np.concatenate((np.arange(0, ny/2), np.arange(-ny/2, 0)))
ky[0] = 1e-6
KX, KY = np.meshgrid(kx, ky)
K = KX**2 + KY**2

#+++++++++++++++  4. Return Code from HW 4
# Parameters
m = 64
L = 20
dx = L / m
n = m * m

e0 = np.zeros(n)
e1 = np.ones(n)
e2 = np.copy(e1)
e4 = np.copy(e0)

for j in range(1, m+1):
    e2[m*j - 1] = 0 
    e4[m*j - 1] = 1

# Adjusted vectors for diagonals
e3 = np.zeros_like(e2)
e3[1:n] = e2[0:n-1]
e3[0] = e2[n-1]

e5 = np.zeros_like(e4)
e5[1:n] = e4[0:n-1]
e5[0] = e4[n-1]

# Construct Matrix a (Laplacian)
diagonals_A = [e1, e1, e5, e2, -4 * e1, e3, e4, e1, e1]
offsets_A = [-(n - m), -m, -m + 1, -1, 0, 1, m - 1, m, (n - m)]
A = (spdiags(diagonals_A, offsets_A, n, n) / (dx**2)).toarray()

# Construct Matrix C (Partial derivative with respect to y)
diagonals_B = [e1, -e1, e1, -e1]
offsets_B = [-(n - m),-m, m, (n - m)]
B = (spdiags(diagonals_B, offsets_B, n, n) / (2 * dx)).toarray()

# Construct Matrix b (Partial derivative with respect to x)
diagonals_C = [e5, -e2, e3, -e4]
offsets_C = [-m + 1, -1, 1, m - 1]
C = (spdiags(diagonals_C, offsets_C, n, n) / (2 * dx)).toarray()

A[0, 0] = 2

#============================================================================================

# Fast Fourier Transform (FFT)

def spc_rhs(t, w, nx, ny, K, nu):
    wtc = w.reshape((nx, ny))
    wt = fft2(wtc)
    psit = -wt / K
    psi = np.real(ifft2(psit))
    psi = psi.flatten()
    rhs = nu * np.dot(A, w) - np.dot(B, psi) * np.dot(C, w) + np.dot(C, psi) * np.dot(B, w)
    return rhs

# Solution
start_time = time.time()
wtsol = solve_ivp(spc_rhs, (0, 4), w1, t_eval=tspan, method = 'RK45', args = (nx, ny, K, nu))
A1 = wtsol.y
end_time = time.time()

fft_time = end_time - start_time

print(A1)
print(fft_time)

# Plot the solution at each time step
for j, t in enumerate(tspan):
    wtc = A1[:, j].reshape((ny, nx)) 
    wtc2 = A1w2[:, j].reshape((ny, nx)) 
    plt.subplot(3, 3, j + 1)
    plt.pcolor(x, y, wtc+wtc2, shading='auto', cmap='gnuplot')
    # plt.pcolor(x, y, wtc2, shading='auto', cmap='gnuplot')
    plt.title(f'Time: {t}')
    plt.colorbar()

plt.tight_layout()
plt.show()

# +++++++++++++++  Set up The Movie .gif
# gif_frames = []

# Plot the solution at each time step and save frames
# for j, t in enumerate(tspan):
#     wtc = A1[:, j].reshape((ny, nx)) 
#     # wtc2 = A1w2[:, j].reshape((ny, nx)) 
    
#     # Create plot
#     fig, ax = plt.subplots()
#     c = ax.pcolor(x, y, wtc, shading='nearest', cmap='gnuplot')
#     fig.colorbar(c)
#     ax.set_title(f'Time: {t}')
    
#     # Save the current plot as an image frame
#     plt.savefig('frame.png')  # Save frame to file
#     plt.close(fig)
    
#     # Append the frame to gif_frames list
#     gif_frames.append(imageio.imread('frame.png'))

# # Create the .gif
# imageio.mimsave('animation.gif', gif_frames, duration=0.5)  # 0.5 seconds between frames

# # Optional: Remove the frame image after gif creation
# import os
# os.remove('frame.png')

# print("GIF created successfully!")


#================================================================================

# Direct Solver

w_ds = (np.exp(-X**2 - (Y**2)/20)).flatten()

def spc_rhs2(t, w_ds, nu, A, B, C):
    psi = solve(A, w_ds)
    rhs2 = nu * np.dot(A, w_ds) - np.dot(B, psi) * np.dot(C, w_ds) + np.dot(C, psi) * np.dot(B, w_ds)
    return rhs2

start_time = time.time()
wtsol_ds = solve_ivp(spc_rhs2, (0, 4), w_ds, t_eval=tspan, method = 'RK45', args = (nu, A, B, C))
A2 = wtsol_ds.y
end_time = time.time()

Ab_time = end_time - start_time

print(A2)
print(Ab_time)

for j, t in enumerate(tspan):
    w_ds = A2[:, j].reshape((ny, nx)) 
    plt.subplot(3, 3, j + 1)
    plt.pcolor(x, y, w_ds, shading='auto', cmap='gnuplot')
    plt.title(f'Time: {t}')
    plt.colorbar()

plt.tight_layout()
plt.show()

# #================================================================================

# LU Solver

w_lu = (np.exp(-X**2 - (Y**2)/20)).flatten()

P, L, U = lu(A)

def spc_rhs_lu(t, w_lu, nu, A, B, C, P, L):
    Pw = np.dot(P, w_lu)
    foo = solve_triangular(L, Pw, lower=True)
    psi = solve_triangular(U, foo)
    rhs_lu = nu * np.dot(A, w_lu) - np.dot(B, psi) * np.dot(C, w_lu) + np.dot(C, psi) * np.dot(B, w_lu)
    return rhs_lu

start_time = time.time()
wtsol_lu = solve_ivp(spc_rhs_lu, (0, 4), w_lu, t_eval=tspan, method = 'RK45', args = (nu, A, B, C, P, L))
A3 = wtsol_lu.y
end_time = time.time()

LU_time = end_time - start_time

print(A3)
print(LU_time)

for j, t in enumerate(tspan):
    w_lu = A3[:, j].reshape((ny, nx)) 
    plt.subplot(3, 3, j + 1)
    plt.pcolor(x, y, w_lu, shading='auto', cmap='gnuplot')
    plt.title(f'Time: {t}')
    plt.colorbar()

plt.tight_layout()
plt.show()


#============================================================================

# BiCGSTAB Solver

w_bicgstab = (np.exp(-X**2 - (Y**2)/20)).flatten()

def spc_rhs_bicgstab(t, w_bicgstab, nu, A, B, C):
    psi, _ = bicgstab(A, w_bicgstab, rtol=1e-4)
    return nu * np.dot(A, w_bicgstab) - np.dot(B, psi) * np.dot(C, w_bicgstab) + np.dot(C, psi) * np.dot(B, w_bicgstab)

start_time = time.time()
wtsol_bicgstab = solve_ivp(spc_rhs_bicgstab, (0, 4), w_bicgstab, t_eval=tspan, method='RK45', args=(nu, A, B, C))
A4 = wtsol_bicgstab.y
end_time = time.time()

bicgstab_t = end_time - start_time

print(A4)
print("Time to run BiCGSTAB : ", bicgstab_t)


#===========================================================================

# GMRES Solver
w_gmres = (np.exp(-X**2 - (Y**2)/20)).flatten()

def spc_rhs_gmres(t, w_gmres, nu, A, B, C):
    psi, _ = gmres(A, w_gmres, rtol=1e-6)
    return nu * np.dot(A, w_gmres) - np.dot(B, psi) * np.dot(C, w_gmres) + np.dot(C, psi) * np.dot(B, w_gmres)

start_time = time.time()
wtsol_gmres = solve_ivp(spc_rhs_gmres, (0, 4), w_gmres, t_eval=tspan, method='RK45', args=(nu, A, B, C))
A5 = wtsol_gmres.y
end_time = time.time()

gmres_t = end_time - start_time

print(A5)
print("Time to run GMRES : ", gmres_t)















































