import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# Load and process data
df = pd.read_csv('../data/vgsales.csv')

# Basic data cleaning
df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
df = df.dropna(subset=['Year'])

# Analysis
sales_by_year = df.groupby('Year')['Global_Sales'].sum().reset_index()
genre_analysis = df.groupby('Genre')['Global_Sales'].agg(['sum', 'count']).reset_index()
publisher_analysis = df.groupby('Publisher')['Global_Sales'].sum().sort_values(ascending=False)

# Export processed data
df.to_csv('../data/processed_vgsales.csv', index=False)

# Generate some visualizations for analysis
plt.figure(figsize=(12, 6))
sns.lineplot(data=sales_by_year, x='Year', y='Global_Sales')
plt.title('Global Video Game Sales Trend')
plt.savefig('../analysis/sales_trend.png')