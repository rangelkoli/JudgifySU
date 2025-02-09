import pandas as pd
import asyncio
from typing import List
import time
from aiAgentPosterApp import get_professor_expertise
from aiAgentPosterApp2 import get_professor_background

async def process_rows(df: pd.DataFrame) -> List[str]:
    tasks = []
    results = []
    
    # Process in smaller batches to avoid overwhelming the API
    batch_size = 5
    for i in range(0, len(df), batch_size):
        batch_df = df.iloc[i:i+batch_size]
        batch_tasks = []
        
        for index, row in batch_df.iterrows():
            # if index % 2 == 0:
            #     # task = get_professor_expertise(row.to_dict())
            #     pass
            # else:
            task = get_professor_background(row.to_dict())
            batch_tasks.append(task)
        
        # Process batch and handle failures
        try:
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            results.extend([
                str(r) if not isinstance(r, Exception) else "Error: Rate limit exceeded" 
                for r in batch_results
            ])
            
            # Save intermediate results
            temp_df = df.iloc[:len(results)].copy()
            temp_df['Research_Expertise'] = results
            temp_df.to_excel('temp_results.xlsx', index=False)
            
        except Exception as e:
            print(f"Error processing batch: {str(e)}")
            results.extend(["Error: Batch processing failed"] * len(batch_tasks))
    
    return results

def process_excel(input_file: str, output_file: str):
    # Read the Excel file
    df = pd.read_excel(input_file)
    print(f"Processing {len(df)} rows using alternating agents...")
    
    # Run async processing
    results = asyncio.run(process_rows(df))
    
    # Add new column with results
    df['Research_Expertise'] = results
    
    # Save to new Excel file
    df.to_excel(output_file, index=False)
    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    input_file = "professorsfromeecs.xlsx"
    output_file = "professors_with_expertise.xlsx"
    
    process_excel(input_file, output_file)
    print("Processing complete!")
