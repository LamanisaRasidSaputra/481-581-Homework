import numpy as np

D = np.array([[1, 2], [2, 3], [-1, 0]])
y = np.array([0, 1])
z = np.array([1, 2, -1])

A9 = np.dot(D, y) + z

print(A9)
