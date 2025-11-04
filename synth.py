import pandas as pd
import numpy as np

n = 5000
np.random.seed(42)

oil = np.random.binomial(1, 0.4, n)
milk = np.random.binomial(1, 0.5, n)
bread = (oil & (np.random.rand(n) < 0.6)) | (np.random.rand(n) < 0.2)

df = pd.DataFrame({
    "transactionID": range(1, n+1),
    "OilPurchased": oil,
    "MilkPurchased": milk,
    "BreadPurchased": bread.astype(int)
})

df.to_csv("data/external/storeshelfoptimization_synth.csv", index=False)
