import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

# Konstanta dan pengaturan
L = 4
K = 1
xspan = np.linspace(-L, L, 81)
epsilon_n = 0
d_epsilon = 0.2
tol = 1e-6
n_max = 5

# Define Quantum Harmonik Oscilator
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
            print(f"Nilai eigen untuk n {n}: {epsilon_guess}")
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

print("Eigenfunctions (Fungsi Eigen):")
print(A1)
print("Eigenvalues (Nilai Eigen):")
print(A2)
print(A1 [1,2])

plt.figure(figsize=(10, 6))
for i in range(n_max):
    plt.plot(xspan, eigenfunctions[:,i], label=f'phi_{i+1}')

plt.legend()
plt.title('Fungsi Eigen Osilator Harmonik Kuantum')
plt.xlabel('x')
plt.ylabel('phi_n(x)')
plt.grid(True)
plt.show()
