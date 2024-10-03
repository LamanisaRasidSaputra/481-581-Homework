import numpy as np

def f(x):
    return x * np.sin(3 * x) - np.exp(x)

def f_prime(x):
    return np.sin(3 * x) + 3 * x * np.cos(3 * x) - np.exp(x)

def newton_raphson(x0, tol=1e-6, max_iter=1000):
    x_values = [x0]
    for _ in range(max_iter):
        x_new = x0 - f(x0) / f_prime(x0)
        x_values.append(x_new)
        if abs(f(x_new)) < tol:
            break
        x0 = x_new
    return np.array(x_values), len(x_values)

x0 = -1.6
A1, iterations_newton = newton_raphson(x0)

print(A1)
