import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_professors():
    # URL of the faculty page
    url = "https://ecs.syracuse.edu/faculty-staff"
    
    try:
        # Send HTTP request
        response = requests.get(url)
        response.raise_for_status()
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find all profile name elements
        profile_elements = soup.find_all('div', class_='profile-name')
        
        professors = []
        for element in profile_elements:
            # Extract the name from the <a> tag inside profile-name div
            name_link = element.find('a')
            if name_link:
                professors.append(name_link.text.strip())
        
        # Create DataFrame
        df = pd.DataFrame(professors, columns=['Professor Name'])
        
        # Save to Excel
        excel_path = '/Users/rangelkoli/Desktop/Projects/posterAiAgent/professorsfromeecs.xlsx'
        df.to_excel(excel_path, index=False)
        
        # Print all professor names
        print("Syracuse ECS Professors:")
        print("-----------------------")
        for professor in sorted(professors):  # Sort alphabetically
            print(professor)
        
        print(f"\nTotal number of professors: {len(professors)}")
        print(f"Professors list saved to: {excel_path}")
            
    except requests.RequestException as e:
        print(f"Error fetching the webpage: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    scrape_professors()
