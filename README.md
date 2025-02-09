```markdown
# 🏆 ECS Challenge: Research Poster-Judge Assignment

## 📌 Overview
This project streamlines the process of **assigning judges to research posters**, collecting and displaying **poster scores**, and **generating a final ranking**. It comprises four main components:

1. **ECS Challenge Assignment (Part 1)**  
2. **Next.js Application**  
3. **Flask Application**  
4. **Part 3 Ranking Algorithm**

By enforcing scheduling constraints, avoiding conflicts of interest, and leveraging semantic expertise matching, this system ensures fair and efficient allocations while providing clear outputs such as judge assignments, poster allocations, and a 0–1 matrix for visualization.

---

## 🔹 Key Features
- **Constraint-Based Assignment**  
  Automatically assigns judges to posters (Part 1) using an optimization model:
  - Each poster gets exactly 2 judges.
  - Each judge can review up to 6 posters.
  - Judges cannot review their own advisee’s posters.
  - Matching via semantic similarity + department alignment (AllenAI SPECTER).

- **Next.js Web Interface**  
  A React-based frontend for uploading files, displaying results, and facilitating user interaction.

- **Flask Backend**  
  Handles data ingestion, file processing, optional database connectivity, and provides endpoints for Part 1’s optimization logic and Part 3’s final scoring.

- **Part 3 Ranking (Supercharged Z-Score)**  
  Takes raw judge scores (0–10), interprets 0 as “not reviewed,” applies outlier winsorizing, and produces a final rank of posters using normalized z‐scores.

- **Excel/CSV Outputs**  
  Generates clear files: 
  - Poster–Judge mappings, 
  - Judge–Poster summaries, 
  - 0–1 assignment matrices, 
  - Final ranking order.

---

## 📁 Project Structure

```markdown

```text
ECS_Challenge_Project
├── part1/                      # ECS Challenge Assignment (Part 1)
│   ├── app.py                  # Flask endpoint for handling judge-to-poster assignment
│   ├── assignment_model.py     # Optimization logic using PuLP
│   ├── final_expertise.csv     # Judge expertise data
│   ├── posters.xlsx            # Poster information
│   ├── judges.csv              # Judge list & availability
│   └── requirements.txt
├── nextjs-app/                 # Next.js frontend
│   ├── pages/                  # Page components
│   ├── components/             # Reusable UI components
│   └── package.json
├── flask-app/                  # Additional Flask endpoints for Part 2 features or admin
│   ├── app.py                  # Flask entry point
│   └── requirements.txt
├── Part3/                      # Ranking algorithm (Part 3)
│   ├── ECS_Challenge_Part3.py
│   ├── SampleInput_Part3.xlsx
│   └── requirements.txt
└── README.md                   # This documentation file
```
```


*(Adjust filenames/folders as needed for your real setup.)*

---

## 🛠️ Setup Instructions

### 1️⃣ Install Required Packages

**A. Python (3.8+)**  
For Part 1, Flask, and Part 3:

```bash
cd path/to/your/project
# (Optional) create a virtual environment:
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows

pip install -r part1/requirements.txt    # For ECS Challenge Part 1
pip install -r flask-app/requirements.txt # For the Flask application
pip install -r Part3/requirements.txt    # For Part 3 Ranking
```

**B. Node.js (14+ recommended)**  
For the Next.js app:

```bash
cd nextjs-app
npm install
# or yarn install
```

### 2️⃣ Setting Up Part 1 Data

- **Judges file**: `judges.csv` (includes judge availability, department, etc.)  
- **Posters file**: `posters.xlsx` (poster titles, programs, advisors, etc.)  
- **Judge Expertise**: `final_expertise.csv` with columns `"Name"` and `"Summary"` for semantic analysis.

*(Place these in the `part1/` folder, or the location specified in your code.)*

### 3️⃣ Next.js Environment Variables

If the Next.js app needs environment variables (like an API endpoint), create a `.env.local` in `nextjs-app/`. For example:

```
API_URL=http://localhost:5000
```

*(Ensure this matches the Flask endpoint URL.)*

### 4️⃣ Flask Environment Variables (Optional)

If the Flask apps require specific configs (like `FLASK_ENV=development`, database credentials, or an Anthropic API key), set them in a `.env` file or export them in your environment.

---

## 🚀 How to Run the Project

1. **Part 1 (ECS Challenge Assignment)**

   - Navigate to `part1/`.  
   - Start the Flask endpoint:  
     ```bash
     python app.py
     ```
   - (Alternatively, some versions might require running `main.py`—depends on how you structured it.)
   - **Upload** your files (`judges.csv`, `posters.xlsx`) via the endpoint (e.g., `/process-excel`) or direct file paths.
   - The system will:
     1. **Load** judge/poster data.
     2. **Compute** embeddings (AllenAI SPECTER) + department matching.
     3. **Solve** the assignment model (PuLP).
     4. **Output** CSV/Excel files (e.g., `posters_with_judges_specter.csv`).

2. **Next.js App**  
   - Go to `nextjs-app/`.
   - Development:
     ```bash
     npm run dev
     ```
     The app should be at [http://localhost:3000](http://localhost:3000).  
   - Production:
     ```bash
     npm run build
     npm run start
     ```

3. **Flask Application** (for additional endpoints or Part 2 scoring)  
   - Go to `flask-app/`.  
   - Run:
     ```bash
     python app.py
     ```
   - By default, Flask listens on [http://127.0.0.1:5000](http://127.0.0.1:5000).  

4. **Part 3 Ranking Algorithm**  
   - Go to `Part3/`.
   - Make sure your input file (e.g., `SampleInput_Part3.xlsx`) is there.
   - Run:
     ```bash
     python ECS_Challenge_Part3.py
     ```
   - This will compute z‐scores for each poster’s judge scores (0 = not reviewed), winsorize outliers, and **print** a final ranking.

---

## 📊 Generated Output Files

1. **posters_with_judges_specter.csv**  
   - Shows which judges are assigned to each poster (Part 1).  
2. **judges_with_posters_specter.csv**  
   - Summarizes how many posters each judge sees (Part 1).  
3. **assignment_matrix.csv** (or `.xlsx`)  
   - 0–1 matrix linking posters and judges.  
4. **Ranking Output (Part 3)**  
   - The script prints a sorted list. If needed, you can modify the script to generate an Excel or CSV.

---

## ⚠️ Error Handling

In each component, we’ve added **try/except** blocks or checks to handle unexpected data or runtime issues.  
- **Part 1**: If the optimization fails, it logs an error but continues so you can inspect partial outputs.  
- **Next.js**: Basic error messages appear in the console and browser.  
- **Flask**: Exceptions are logged in the terminal.  
- **Part 3**: If a judge has zero variance or no scores, the script either skips them or applies a fallback epsilon for standard deviation.

---

## Contact / Support

If you have questions or encounter issues, please contact the **ECS Challenge Team**:

- **Suved Ganduri** (sganduri@syr.edu)  
- **Rangel Koli** (rakolii@syr.edu)  
- **Saad Shah** (sshah62@syr.edu)

Thank you for using this project!
```
