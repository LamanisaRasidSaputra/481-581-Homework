import numpy as np

def f(x):
    return x * np.sin(3 * x) - np.exp(x)

def f_prime(x):
    return np.sin(3 * x) + 3 * x * np.cos(3 * x) - np.exp(x)

def bisection(x_left, x_right, tol=1e-6, max_iter=1000):
    x_mid_values = []
    for _ in range(max_iter):
        x_mid = (x_left + x_right) / 2
        x_mid_values.append(x_mid)
        if abs(f(x_mid)) < tol:
            break
        if f(x_left) * f(x_mid) < 0:
            x_right = x_mid
        else:
            x_left = x_mid
    return np.array(x_mid_values), len(x_mid_values)

x_left = -0.7
x_right = -0.4
A2, iterations_bisection = bisection(x_left, x_right)

print(A2)
