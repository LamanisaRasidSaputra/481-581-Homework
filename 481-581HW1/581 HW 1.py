import numpy as np

# Part 1 Define the function and its derivative for Newton-Raphson method
def f(x):
    return x * np.sin(3 * x) - np.exp(x)

def f_prime(x):
    return np.sin(3 * x) + 3 * x * np.cos(3 * x) - np.exp(x)

# Newton-Raphson method
def newton_raphson(x0, tol=1e-6, max_iter=1000):
    x_values = [x0]
    for _ in range(max_iter):
        x_new = x0 - f(x0) / f_prime(x0)
        x_values.append(x_new)
        if abs(f(x_new)) < tol:
            break
        x0 = x_new
    return np.array(x_values), len(x_values)

# Bisection method
def bisection(x_left, x_right, tol=1e-6, max_iter=1000):
    x_mid_values = []
    for j in range(max_iter):
        x_mid = (x_left + x_right) / 2
        x_mid_values.append(x_mid)
        if abs(f(x_mid)) < tol:
            break
        if f(x_left) * f(x_mid) < 0:
            x_right = x_mid
        else:
            x_left = x_mid
    return np.array(x_mid_values), len(x_mid_values)

# Initial guess for Newton-Raphson and endpoints for Bisection
x0 = -1.6 
x_left = -0.7
x_right = -0.4

# Result from part 1
A1, iterations_newton = newton_raphson(x0)
A2, iterations_bisection = bisection(x_left, x_right)
A3 = np.array([iterations_newton, iterations_bisection])

# Part 2 Define the matrices and vectors
A = np.array([[1, 2], [-1, 1]])
B = np.array([[2, 0], [0, 2]])
C = np.array([[2, 0, -3], [0, 0, -1]])
D = np.array([[1, 2], [2, 3], [-1, 0]])
x = np.array([1, 0])
y = np.array([0, 1])
z = np.array([1, 2, -1])

# Result from part 2
A4 = A + B
A5 = 3 * x - 4 * y
A6 = np.dot(A, x)
A7 = np.dot(B, x - y)
A8 = np.dot(D, x)
A9 = np.dot(D, y) + z
A10 = np.dot(A, B)
A11 = np.dot(B, C)
A12 = np.dot(C, D)

print(A1)
print(A2)
print(A3)
print(A4)
print(A5)
print(A6)
print(A7)
print(A8)
print(A9)
print(A10)
print(A11)
print(A12)
