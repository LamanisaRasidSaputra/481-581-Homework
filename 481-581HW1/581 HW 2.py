import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

# Konstanta dan pengaturan
L = 4  # Set nilai L
K = 1  # Konstanta osilasi
xspan = np.linspace(-L, L, 81)  # Rentang nilai x dari -L ke L
epsilon_n = 0  # Tebakan awal untuk epsilon (nilai eigen)
d_epsilon = 0.2  # Langkah perubahan untuk epsilon
tol = 1e-6  # Toleransi untuk konvergensi nilai eigen
n_max = 5  # Jumlah mode yang akan dihitung

# Fungsi yang mendefinisikan persamaan osilator harmonik kuantum
def harmonic_shoot(y, x, epsilon):
    return [y[1], (K * x**2 - epsilon) * y[0]]

# Menyimpan fungsi eigen dan nilai eigen
eigenfunction = []
eigenvalue = []

# Loop untuk mode
for n in range(n_max):
    epsilon_guess = epsilon_n
    d_epsilon = 0.2
    for _ in range(1000):  # Iterasi untuk menemukan nilai eigen
        phi0 = [1, np.sqrt(L**2 - epsilon_guess)]  # Tebakan awal untuk phi0
        y = odeint(harmonic_shoot, phi0, xspan, args=(epsilon_guess,))  # Menyelesaikan persamaan

        # Pengecekan batas di ujung interval
        phi_guess = y[-1, 1] + np.sqrt(L**2 - epsilon_guess) * y[-1, 0]
        if abs(phi_guess) < tol:  # Jika solusi sudah konvergen
            print(f"Nilai eigen untuk n {n}: {epsilon_guess}")
            eigenvalue.append(epsilon_guess)  # Menyimpan nilai eigen
            break

        # Penyesuaian epsilon untuk iterasi berikutnya
        if (-1) ** (n) * phi_guess > 0:
            epsilon_guess += d_epsilon
        else:
            epsilon_guess -= d_epsilon / 2
            d_epsilon /= 2

    # Normalisasi fungsi eigen
    norm = np.trapezoid(y[:, 0] ** 2, xspan)  # Menggunakan metode trapezoid untuk integrasi
    normalized_eigenfunction = abs(y[:, 0]) / np.sqrt(norm)  # Normalisasi fungsi eigen
    epsilon_n = epsilon_guess + 0.1
    eigenfunction.append(normalized_eigenfunction)

# Konversi ke array numpy untuk plotting
eigenfunctions = np.column_stack(eigenfunction)
eigenvalues = np.array(eigenvalue)

A1 = eigenfunctions
A2 = eigenvalues

# Output hasil
print("Eigenfunctions (Fungsi Eigen):")
print(A1)
print("Eigenvalues (Nilai Eigen):")
print(A2)
print(A1 [1,2])

# Plot hasilnya
plt.figure(figsize=(10, 6))
for i in range(n_max):
    plt.plot(xspan, eigenfunctions[:,i], label=f'phi_{i+1}')  # Plot setiap fungsi eigen

plt.legend()
plt.title('Fungsi Eigen Osilator Harmonik Kuantum')
plt.xlabel('x')
plt.ylabel('phi_n(x)')
plt.grid(True)
plt.show()
