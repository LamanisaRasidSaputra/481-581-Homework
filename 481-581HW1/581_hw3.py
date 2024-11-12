#=================================== PART A =====================================
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

L = 4  
K = 1
xspan = np.linspace(-L, L, 81)
epsilon_n = 0
d_epsilon = 0.2
tol = 1e-6
n_max = 5

def harmonic_shoot(y, x, epsilon):
    return [y[1], (K * x**2 - epsilon) * y[0]]

eigenfunction = []
eigenvalue = []

for n in range(n_max):
    epsilon_guess = epsilon_n
    d_epsilon = 0.2
    for _ in range(1000):
        phi0 = [1, np.sqrt(L**2 - epsilon_guess)]
        y = odeint(harmonic_shoot, phi0, xspan, args=(epsilon_guess,)) 

        phi_guess = y[-1, 1] + np.sqrt(L**2 - epsilon_guess) * y[-1, 0]
        if abs(phi_guess) < tol:
            eigenvalue.append(epsilon_guess)
            break

        if (-1) ** (n) * phi_guess > 0:
            epsilon_guess += d_epsilon
        else:
            epsilon_guess -= d_epsilon / 2
            d_epsilon /= 2

    norm = np.trapezoid(y[:, 0] ** 2, xspan) 
    normalized_eigenfunction = abs(y[:, 0]) / np.sqrt(norm)
    epsilon_n = epsilon_guess + 0.1
    eigenfunction.append(normalized_eigenfunction)

eigenfunctions = np.column_stack(eigenfunction)
eigenvalues = np.array(eigenvalue)

A1 = eigenfunctions
A2 = eigenvalues

print("Eigenfunctions A1:")
print(A1,"\n")
print("Eigenvalues A2:")
print(A2,"\n")


#Plotting
plt.figure(figsize=(10, 6))
for i in range(n_max):
    plt.plot(xspan, eigenfunctions[:,i], label=f'phi_{i+1}')  # Plot setiap fungsi eigen

plt.legend()
plt.title('Fungsi Eigen Osilator Harmonik Kuantum')
plt.xlabel('x')
plt.ylabel('phi_n(x)')
plt.grid(True)
plt.show()



#=================================== PART B =====================================
import numpy as np
from scipy.sparse.linalg import eigs
import matplotlib.pyplot as plt

L = 4
x = np.arange(-L, L + 0.1, 0.1)
n = len(x)
dx = x[1] - x[0]

H = np.zeros((n - 2, n - 2))

for j in range(n - 2):
    H[j, j] = -2 - (dx**2) * x[j + 1]**2
    if j < n - 3:
        H[j + 1, j] = 1
        H[j, j + 1] = 1

H[0, 0] = H[0, 0] + 4 / 3
H[0, 1] = H[0, 1] - 1 / 3
H[-1, -1] = H [-1, -1] + 4 / 3
H[-1, -2] = H[-1, -2] - 1 / 3

eigvals, eigvecs = eigs(-H, k=5, which='SM')

vals2 = np.vstack([4/3 * eigvecs[0,:] - 1/3 * eigvecs[1, :], eigvecs, 4/3 * eigvecs[-1, :] - 1/3 * eigvecs[-2, :]])

eigenvecs = np.zeros((n, 5))
eigenvals = np.zeros(5)

for j in range (5):
    norm = np.sqrt(np.trapezoid(vals2[:, j]**2, x))
    eigenvecs[:, j] = np.abs(vals2[:, j] / norm)

eigenvals = np.sort(eigvals[:5] / dx**2)

A3 = eigenvecs
A4 = eigenvals

print("Eigenfunctions A3:")
print(A3,"\n")
print("Eigenvalues A4:")
print(A4,"\n")

# Plot eigenfunctions
plt.figure(figsize=(10, 6))
for j in range(5):
    plt.plot(x, A3[:, j], label=f'Eigenfunction {j+1}')
plt.xlabel('Position x')
plt.ylabel('Amplitude')
plt.title('Eigenfunctions')
plt.legend()
plt.grid(True)
plt.show()



#=================================== PART C =====================================
import numpy as np
from scipy.integrate import solve_ivp
import matplotlib.pyplot as plt


def hw3_rhs_c(x, y, epsilon, gamma):
    return[y[1], (gamma * y[0]**2 + x**2 - epsilon) * y[0]]

L = 2
x = np.arange(-L, L + 0.1, 0.1)
n = len(x)
tol = 1e-4
eigenvals_pos, eigenvals_neg = np.zeros(2), np.zeros(2)
eigenvecs_pos, eigenvecs_neg = np.zeros((n, 2)), np.zeros((n, 2))

for gamma in [0.05, -0.05]:
    epsilon0, A = 0.1, 1e-6
    for jmodes in range(2):
        dA = 0.01
        for jj in range(100):
            epsilon, d_epsilon = epsilon0, 0.2
            for j in range(100):
                y0 = [A, np.sqrt(L**2 - epsilon) * A]
                sol = solve_ivp(lambda x, y: hw3_rhs_c(x, y, epsilon, gamma), [x[0], x[-1]], y0, t_eval=x)
                y_sol = sol.y.T
                x_sol = sol.t

                bc = y_sol[-1, 1] + np.sqrt(L**2 - epsilon) * y_sol[-1, 0]
                if abs(bc) < tol:
                    break
                
                if (-1)**(jmodes) * bc > 0:
                    epsilon += d_epsilon
                else:
                    epsilon -= d_epsilon
                    d_epsilon /= 2

            area = np.trapezoid(y_sol[:, 0]**2, x_sol)
            if abs(area - 1) < tol:
                break
            if area < 1:
                A += dA
            else:
                A -= dA
                dA /= 2
            
        epsilon0=epsilon+0.2
        if gamma > 0:
            eigenvals_pos[jmodes] = epsilon
            eigenvecs_pos[:, jmodes] = np.abs(y_sol[:, 0])
        else:
            eigenvals_neg[jmodes] = epsilon
            eigenvecs_neg[:, jmodes] = np.abs(y_sol[:, 0])

A5 = eigenvecs_pos
A6 = eigenvals_pos
A7 = eigenvecs_neg
A8 = eigenvals_neg

print("A5 Eigenvalues for gamma = 0.05:\n", A5, "\n")
print("A6 Eigenfunctions for gamma = 0.05:\n", A6, "\n")
print("A7 Eigenvalues for gamma = -0.05:\n", A7, "\n")
print("A8 Eigenfunctions for gamma = -0.05:\n", A8)

# Plotting
plt.figure(figsize=(12, 8))

# Plot for gamma = 0.05
plt.subplot(2, 1, 1)
plt.plot(x, A5[:, 0], label=f'Mode 1, epsilon = {A6[0]:.4f}', linestyle='-', marker='o')
plt.plot(x, A5[:, 1], label=f'Mode 2, epsilon = {A6[1]:.4f}', linestyle='--', marker='s')
plt.title("Eigenfunctions for gamma = 0.05")
plt.xlabel("x")
plt.ylabel("Eigenfunction")
plt.legend()

# Plot for gamma = -0.05
plt.subplot(2, 1, 2)
plt.plot(x, A7[:, 0], label=f'Mode 1, epsilon = {A8[0]:.4f}', linestyle='-', marker='o')
plt.plot(x, A7[:, 1], label=f'Mode 2, epsilon = {A8[1]:.4f}', linestyle='--', marker='s')
plt.title("Eigenfunctions for gamma = -0.05")
plt.xlabel("x")
plt.ylabel("Eigenfunction")
plt.legend()

plt.tight_layout()
plt.show()



#=================================== PART D =====================================
import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp

def hw1_rhs_a(x, y, E):
    return [y[1], (K * x**2 - E) * y[0]]

# Parameters
K = 1
E = 1
L = 2
x_span = [-L, L]
y0 = [1, np.sqrt(K * L**2 - 1)] 

tolerances = [1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9, 1e-10]
methods = ['RK45', 'RK23', 'Radau', 'BDF']

average_step_sizes = {method: [] for method in methods}
local_errors = {method: [] for method in methods}

for method in methods:
    for tol in tolerances:
        option = {'rtol': tol, 'atol': tol}
        sol = solve_ivp(hw1_rhs_a, x_span, y0, method=method, args=(E,), **option)
        
        step_sizes = np.diff(sol.t)
        avg_step_size = np.mean(step_sizes)
        average_step_sizes[method].append(avg_step_size)

        errors = np.diff(sol.y[0])
        local_error = np.mean(np.abs(errors))
        local_errors[method].append(local_error)

Slope = []
for method in methods:
    slope, _ = np.polyfit(np.log(average_step_sizes[method]), np.log(tolerances), 1)
    Slope.append(float(slope))

A9 = Slope

print("A9:\n", A9)

# Plotting on a log-log scale
plt.figure(figsize=(10, 6))
for method in methods:
    plt.loglog(average_step_sizes[method], tolerances, label=method, marker='o')

plt.ylabel("Tolerance")
plt.xlabel("Average Step Size")
plt.legend()
plt.title("Convergence Study of Different Methods")
plt.grid(True)
plt.show()



import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import solve_ivp



L = 4 
K = 1 
xspan = np.linspace(-L, L, 81)
epsilon_n = 0
d_epsilon = 0.2
tol = 1e-6
n_max = 5

def harmonic_shoot(x, y, epsilon):
    return [y[1], (K * x**2 - epsilon) * y[0]]

eigenfunction = []
eigenvalue = []

for n in range(n_max):
    epsilon_guess = epsilon_n
    d_epsilon = 0.2
    for _ in range(1000):
        phi0 = [1, np.sqrt(L**2 - epsilon_guess)]
        sol = solve_ivp(harmonic_shoot, [-L, L], phi0, args=(epsilon_guess,), t_eval=xspan)

        # Pengecekan batas di ujung interval
        phi_guess = sol.y[1, -1] + np.sqrt(L**2 - epsilon_guess) * sol.y[0, -1]
        if abs(phi_guess) < tol:
            eigenvalue.append(epsilon_guess)
            break

        if (-1) ** (n) * phi_guess > 0:
            epsilon_guess += d_epsilon
        else:
            epsilon_guess -= d_epsilon / 2
            d_epsilon /= 2


    norm = np.trapezoid(sol.y[0] ** 2, xspan)  
    normalized_eigenfunction = abs(sol.y[0]) / np.sqrt(norm)  
    epsilon_n = epsilon_guess + 0.1
    eigenfunction.append(normalized_eigenfunction)

eigenfunctions = np.column_stack(eigenfunction)
eigenvalues = np.array(eigenvalue)

A1 = eigenfunctions
A2 = eigenvalues


#===================================================================================================


import numpy as np
from scipy.sparse.linalg import eigs
import matplotlib.pyplot as plt

L = 4
x = np.arange(-L, L + 0.1, 0.1)
n = len(x)
dx = x[1] - x[0]

H = np.zeros((n - 2, n - 2))

for j in range(n - 2):
    H[j, j] = -2 - (dx**2) * x[j + 1]**2
    if j < n - 3:
        H[j + 1, j] = 1
        H[j, j + 1] = 1

H[0, 0] = H[0, 0] + 4 / 3
H[0, 1] = H[0, 1] - 1 / 3
H[-1, -1] = H [-1, -1] + 4 / 3
H[-1, -2] = H[-1, -2] - 1 / 3

eigvals, eigvecs = eigs(-H, k=5, which='SM')

vals2 = np.vstack([4/3 * eigvecs[0,:] - 1/3 * eigvecs[1, :], eigvecs, 4/3 * eigvecs[-1, :] - 1/3 * eigvecs[-2, :]])

eigenvecs = np.zeros((n, 5))
eigenvals = np.zeros(5)

for j in range (5):
    norm = np.sqrt(np.trapezoid(vals2[:, j]**2, x))
    eigenvecs[:, j] = np.abs(vals2[:, j] / norm)

eigenvals = np.sort(eigvals[:5] / dx**2)

A3 = eigenvecs
A4 = eigenvals



#===================================PART E ===========================================

import numpy as np
import matplotlib.pyplot as plt
from scipy.special import hermite


L = 4
x = np.arange(-L, L + 0.1, 0.1)

def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

hermite = np.array([np.ones_like(x),
    2 * x,
    4 * x**2 - 2,
    8 * x**3 - 12 * x,
    16 * x**4 - 48 * x**2 + 12])


phi = np.zeros((len(x), 5))
for j in range(5):
    phi[:, j] = np.exp(-x**2 / 2) * hermite[j, :] / (np.sqrt(factorial(j) * 2**j * np.sqrt(np.pi)))

ErrorA1 = np.zeros(5)
ErrorA2 = np.zeros(5)
ErrorA3 = np.zeros(5)
ErrorA4 = np.zeros(5)

#print (A1)
print (A2)
#print (A3)
print (A4)

for j in range(5):
    ErrorA1[j] = np.trapezoid((np.abs(A1[:, j]) - np.abs(phi[:, j]))**2, x)
    ErrorA2[j] = 100 * abs(A2[j] - (2 * (j+1) - 1)) / (2 * (j+1) - 1)
    ErrorA3[j] = np.trapezoid((np.abs(A3[:, j]) - np.abs(phi[:, j]))**2, x)
    ErrorA4[j] = 100 * abs(A4[j] - (2 * (j+1) - 1)) / (2 * (j+1) - 1)

# Menyimpan error hasil perhitungan
A10 = ErrorA1
A11 = ErrorA2
A12 = ErrorA3
A13 = ErrorA4

# Menampilkan hasil
print("A10 :\n", A10)
print("A11 :\n", A11)
print("A12 :\n", A12)
print("A13 :\n", A13)

