import numpy as np

B = np.array([[2, 0], [0, 2]])
x = np.array([1, 0])
y = np.array([0, 1])

A7 = np.dot(B, x - y)

print(A7)
