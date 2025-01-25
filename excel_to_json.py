import pandas as pd
import json
import numpy as np

# Path to your Excel file
file_path = r"C:\Users\ahmed\OneDrive\Desktop\ChatGPT_files\Database.xlsx"

# Load the Excel file
excel_data = pd.ExcelFile(file_path)

# Initialize a dictionary to store all sheet data
data_dict = {}

# Iterate through each sheet and process
for sheet_name in excel_data.sheet_names:
    # Read the sheet into a DataFrame
    df = excel_data.parse(sheet_name)
    
    # Replace NaN values with None for JSON compatibility
    df = df.replace({np.nan: None})
    
    # Convert datetime objects to strings
    for col in df.select_dtypes(include=["datetime"]).columns:
        df[col] = df[col].astype(str)
    
    # Convert the DataFrame to a list of dictionaries
    data_dict[sheet_name] = df.to_dict(orient="records")

# Save the processed data as JSON
json_output_path = r"C:\Users\ahmed\OneDrive\Desktop\ChatGPT_files\Database_Clean.json"
with open(json_output_path, "w") as json_file:
    json.dump(data_dict, json_file, indent=4)

print(f"JSON file saved at {json_output_path}")
