"""
DATA PROCESSING AND ANALYSIS MODULE

This module handles the initial data processing and analysis using Python libraries:
- pandas: Data cleaning and manipulation
- numpy: Numerical computations
- seaborn: Statistical visualizations
"""

import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime

print("Starting data processing and analysis...")
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# 1. DATA LOADING
print("\n1. LOADING DATASET")
df = pd.read_csv('../data/vgsales.csv')
print(f"Initial dataset shape: {df.shape}")
print(f"Columns: {', '.join(df.columns)}")

# 2. DATA EXPLORATION
print("\n2. INITIAL DATA EXPLORATION")
print("\nData types:")
print(df.dtypes)

print("\nMissing values by column:")
missing_values = df.isnull().sum()
print(missing_values[missing_values > 0])

print("\nSummary statistics:")
print(df.describe())

# 3. DATA CLEANING
print("\n3. DATA CLEANING")

# 3.1 Handle missing and invalid values
print("Handling missing and invalid values...")
# Convert Year to numeric, coercing errors to NaN
df['Year'] = pd.to_numeric(df['Year'], errors='coerce')
print(f"Years with missing values: {df['Year'].isnull().sum()}")

# Check for years outside reasonable range (e.g., future years)
current_year = datetime.now().year
invalid_years = df[(df['Year'] > current_year) | (df['Year'] < 1950)].shape[0]
print(f"Records with invalid years: {invalid_years}")

# Filter to valid years
df = df[(df['Year'] <= current_year) & (df['Year'] >= 1950) | df['Year'].isnull()]

# Handle missing values in other columns
for col in ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales']:
    # Replace missing sales values with 0
    if df[col].isnull().sum() > 0:
        print(f"Replacing {df[col].isnull().sum()} missing values in {col} with 0")
        df[col] = df[col].fillna(0)

# Drop rows with missing Year values
year_nulls = df['Year'].isnull().sum()
if year_nulls > 0:
    print(f"Dropping {year_nulls} rows with missing Year values")
    df = df.dropna(subset=['Year'])

# 3.2 Check for duplicates
print("\nChecking for duplicates...")
duplicates = df.duplicated().sum()
print(f"Found {duplicates} duplicate records")
if duplicates > 0:
    df = df.drop_duplicates()
    print(f"Removed {duplicates} duplicate records")

# 4. DATA TRANSFORMATION
print("\n4. DATA TRANSFORMATION")

# 4.1 Create derived metrics
print("Creating derived metrics...")

# Calculate regional percentage of global sales
df['NA_Pct'] = (df['NA_Sales'] / df['Global_Sales'] * 100).round(2)
df['EU_Pct'] = (df['EU_Sales'] / df['Global_Sales'] * 100).round(2)
df['JP_Pct'] = (df['JP_Sales'] / df['Global_Sales'] * 100).round(2)
df['Other_Pct'] = (df['Other_Sales'] / df['Global_Sales'] * 100).round(2)

# Create decade column for temporal analysis
df['Decade'] = (df['Year'] // 10 * 10).astype(int)
print(f"Decades represented: {sorted(df['Decade'].unique())}")

# Create sales categories
sales_bins = [0, 0.5, 1, 5, 10, float('inf')]
sales_labels = ['Very Low', 'Low', 'Medium', 'High', 'Blockbuster']
df['Sales_Category'] = pd.cut(df['Global_Sales'], bins=sales_bins, labels=sales_labels)
print(f"Sales categories distribution:\n{df['Sales_Category'].value_counts()}")

# 5. EXPLORATORY ANALYSIS
print("\n5. EXPLORATORY ANALYSIS")

# 5.1 Temporal analysis
print("\nTemporal Analysis:")
sales_by_year = df.groupby('Year')['Global_Sales'].sum().reset_index()
print(f"Year with highest sales: {sales_by_year.loc[sales_by_year['Global_Sales'].idxmax()]['Year']}")

sales_by_decade = df.groupby('Decade')['Global_Sales'].sum().reset_index()
print(f"Sales by decade:\n{sales_by_decade}")

# 5.2 Genre analysis
print("\nGenre Analysis:")
genre_analysis = df.groupby('Genre').agg({
    'Global_Sales': ['sum', 'mean', 'count'],
    'NA_Sales': 'sum',
    'EU_Sales': 'sum',
    'JP_Sales': 'sum'
}).reset_index()
genre_analysis.columns = ['Genre', 'Total_Sales', 'Avg_Sales', 'Game_Count', 'NA_Sales', 'EU_Sales', 'JP_Sales']
genre_analysis = genre_analysis.sort_values('Total_Sales', ascending=False)
print(f"Top 3 genres by sales:\n{genre_analysis[['Genre', 'Total_Sales', 'Game_Count']].head(3)}")

# 5.3 Publisher analysis
print("\nPublisher Analysis:")
publisher_analysis = df.groupby('Publisher')['Global_Sales'].agg(['sum', 'count']).reset_index()
publisher_analysis.columns = ['Publisher', 'Total_Sales', 'Game_Count']
publisher_analysis = publisher_analysis.sort_values('Total_Sales', ascending=False)
print(f"Top 5 publishers by sales:\n{publisher_analysis.head(5)}")

# 5.4 Platform analysis
print("\nPlatform Analysis:")
platform_analysis = df.groupby('Platform')['Global_Sales'].agg(['sum', 'count']).reset_index()
platform_analysis.columns = ['Platform', 'Total_Sales', 'Game_Count']
platform_analysis = platform_analysis.sort_values('Total_Sales', ascending=False)
print(f"Top 5 platforms by sales:\n{platform_analysis.head(5)}")

# 5.5 Regional sales analysis
print("\nRegional Sales Analysis:")
regional_totals = {
    'NA_Sales': df['NA_Sales'].sum(),
    'EU_Sales': df['EU_Sales'].sum(),
    'JP_Sales': df['JP_Sales'].sum(),
    'Other_Sales': df['Other_Sales'].sum()
}
print(f"Regional sales distribution: {regional_totals}")

# 5.6 Correlation analysis
print("\nCorrelation Analysis:")
correlation = df[['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales', 'Global_Sales']].corr()
print(correlation)

# 6. VISUALIZATIONS
print("\n6. GENERATING VISUALIZATIONS")

# Create output directory if it doesn't exist
import os
if not os.path.exists('../analysis/figures'):
    os.makedirs('../analysis/figures')

# 6.1 Sales trend over time
plt.figure(figsize=(12, 6))
sns.lineplot(data=sales_by_year, x='Year', y='Global_Sales')
plt.title('Global Video Game Sales Trend')
plt.xlabel('Year')
plt.ylabel('Global Sales (millions)')
plt.grid(True, alpha=0.3)
plt.savefig('../analysis/figures/sales_trend.png')
print("Generated sales trend visualization")

# 6.2 Genre distribution
plt.figure(figsize=(12, 6))
sns.barplot(data=genre_analysis.head(10), x='Genre', y='Total_Sales')
plt.title('Top 10 Genres by Global Sales')
plt.xlabel('Genre')
plt.ylabel('Global Sales (millions)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('../analysis/figures/genre_sales.png')
print("Generated genre distribution visualization")

# 6.3 Publisher market share
plt.figure(figsize=(12, 6))
top_publishers = publisher_analysis.head(10)
plt.pie(top_publishers['Total_Sales'], labels=top_publishers['Publisher'], autopct='%1.1f%%')
plt.title('Top 10 Publishers Market Share')
plt.tight_layout()
plt.savefig('../analysis/figures/publisher_share.png')
print("Generated publisher market share visualization")

# 6.4 Regional sales comparison
plt.figure(figsize=(10, 6))
regions = ['NA_Sales', 'EU_Sales', 'JP_Sales', 'Other_Sales']
plt.bar(regions, [regional_totals[r] for r in regions])
plt.title('Sales by Region')
plt.ylabel('Sales (millions)')
plt.savefig('../analysis/figures/regional_sales.png')
print("Generated regional sales visualization")

# 6.5 Sales by decade
plt.figure(figsize=(10, 6))
sns.barplot(data=sales_by_decade, x='Decade', y='Global_Sales')
plt.title('Video Game Sales by Decade')
plt.xlabel('Decade')
plt.ylabel('Global Sales (millions)')
plt.savefig('../analysis/figures/decade_sales.png')
print("Generated sales by decade visualization")

# 7. DATA EXPORT
print("\n7. EXPORTING PROCESSED DATA")

# Export main processed dataset
df.to_csv('../data/processed_vgsales.csv', index=False)
print(f"Exported processed dataset with {df.shape[0]} records and {df.shape[1]} columns")

# Export analysis results
sales_by_year.to_csv('../data/sales_by_year.csv', index=False)
genre_analysis.to_csv('../data/genre_analysis.csv', index=False)
publisher_analysis.to_csv('../data/publisher_analysis.csv', index=False)
platform_analysis.to_csv('../data/platform_analysis.csv', index=False)
sales_by_decade.to_csv('../data/sales_by_decade.csv', index=False)
print("Exported analysis results to separate CSV files")

print("\nData processing and analysis complete!")
print(f"Final dataset shape: {df.shape}")
