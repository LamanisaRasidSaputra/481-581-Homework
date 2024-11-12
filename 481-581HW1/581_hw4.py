import numpy as np
import matplotlib.pyplot as plt
from scipy.sparse import spdiags

# Parameters
m = 8
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

# Construct Matrix A (Laplacian)
diagonals_A = [e1, e1, e5, e2, -4 * e1, e3, e4, e1, e1]
offsets_A = [-(n - m), -m, -m + 1, -1, 0, 1, m - 1, m, (n - m)]
A = spdiags(diagonals_A, offsets_A, n, n) / dx**2

# Construct Matrix C (Partial derivative with respect to y)
diagonals_B = [e1, -e1, e1, -e1]
offsets_B = [-(n - m),-m, m, (n - m)]
B = spdiags(diagonals_B, offsets_B, n, n) / (2 * dx)

# Construct Matrix B (Partial derivative with respect to x)
diagonals_C = [e5, -e2, e3, -e4]
offsets_C = [-m + 1, -1, 1, m - 1]
C = spdiags(diagonals_C, offsets_C, n, n) / (2 * dx)

A1 = A.toarray()
A2 = B.toarray()
A3 = C.toarray()

print("Matrix A (Laplacian):\n", A1)
print("\nMatrix B (∂/∂x):\n", A2)
print("\nMatrix C (∂/∂y):\n", A3)

#Plot matrix structure
plt.figure(5)
plt.spy(A1)
plt.title('Matrix Structure')
plt.show()

plt.figure(5)
plt.spy(A2)
plt.title('Matrix Structure')
plt.show()

plt.figure(5)
plt.spy(A3)
plt.title('Matrix Structure')
plt.show()
