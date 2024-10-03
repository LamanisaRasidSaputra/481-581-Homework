import numpy as np

B = np.array([[2, 0], [0, 2]])
C = np.array([[2, 0, -3], [0, 0, -1]])

A11 = np.dot(B, C)

print(A11)
