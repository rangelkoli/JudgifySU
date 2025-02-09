# Project README

This repository contains **four main components**:

1. **ECS Challenge Assignment (Part 1)**
2. **Next.js Application**
3. **Flask Application**
4. **Part 3 Ranking Algorithm**

Follow the instructions below to **install dependencies** and **run** each part.

---

## 1. ECS Challenge Assignment (Part 1)

This component automates the assignment of judges to posters for the ECS Challenge. It uses a constraint-based optimization model (implemented in Python with PuLP) that assigns judges to posters while enforcing several constraints:

- **Hard Constraints:**

  - Each poster must be reviewed by exactly 2 judges.
  - Each judge reviews at most 6 posters.
  - Judges can only review posters if they are available during the poster’s scheduled time slot.
  - Judges are not allowed to review posters if they are also the advisor for that poster.

- **Soft Constraints:**
  - The model computes a compatibility score for each judge–poster pair based on:
    - **Semantic Similarity:** Using the AllenAI SPECTER model (a SciBERT-based model fine-tuned for scientific documents) to compute embeddings from judge expertise (loaded from a separate CSV, `final_expertise.csv`) and poster abstracts.
    - **Department Matching:** A manual keyword dictionary maps the poster’s program to one of the four departments. A binary score (1 for a match, 0 otherwise) is combined with the semantic similarity score.
  - The objective is to maximize the total compatibility across all assignments.

### 1.1 Prerequisites

- **Python 3.8+**
- The following Python packages (listed in your `requirements.txt`):
  - `pandas`
  - `numpy`
  - `pulp`
  - `sentence-transformers`
  - `scikit-learn`
  - `openpyxl` (for reading Excel files)
  - Other dependencies as needed

### 1.2 Installation & Setup

1. **Navigate** to the ECS Challenge Assignment folder (or the root folder if all components share the same environment):
   ```bash
   cd path/to/your/project
   ```
2. (Optional) **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate   # (Linux/Mac)
   # or on Windows:
   venv\Scripts\activate
   ```
3. **Install** the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. **Place Input Files:**
   - Judges file: `judges.csv`
   - Posters file: `posters.xlsx`
   - Judge expertise file: `final_expertise.csv` (must contain at least columns `"Name"` and `"Summary"`)

### 1.3 Running the Assignment Process

1. **Start the Flask endpoint** by running:

   ```bash
   python app.py
   ```

   (This will start the Flask server, which exposes endpoints such as `/process-excel` for processing the input files.)

2. **Upload the files** via the provided endpoint (for example, using a REST client or the Next.js frontend):

   - Upload `judges.csv` and `posters.xlsx` to `/process-excel`.
   - The process will:
     - Load and preprocess the judges and posters data.
     - Merge judge expertise from `final_expertise.csv` based on the judge’s full name.
     - Map poster programs to departments using a manual keyword dictionary.
     - Compute embeddings with the AllenAI SPECTER model.
     - Compute compatibility scores by combining semantic similarity and department matching.
     - Build and solve the optimization model (using PuLP with CBC).
     - Generate output files: `posters_with_judges_specter.csv`, `judges_with_posters_specter.csv`, and `assignment_matrix.csv`.

3. **Check the output files** generated in your project folder for review and further processing.

---

## 2. Next.js Application

### 2.1 Prerequisites

- **Node.js** (version 14 or higher recommended)
- **npm** or **yarn**

### 2.2 Installation & Setup

1. **Navigate** to the Next.js folder:
   ```bash
   cd path/to/your/project/nextjs-app
   ```
2. **Install** dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```
3. (Optional) **Set up environment variables** by creating a `.env.local` file in the `nextjs-app` folder.

### 2.3 Running the Application

- **Development mode**:

  ```bash
  npm run dev
  ```

  or

  ```bash
  yarn dev
  ```

  The app will be accessible at [http://localhost:3000](http://localhost:3000).

- **Production build**:
  ```bash
  npm run build
  npm run start
  ```
  or
  ```bash
  yarn build
  yarn start
  ```

---

## 3. Flask Application

### 3.1 Prerequisites

- **Python 3.8+**
- **pip** (or another package manager)

### 3.2 Installation & Setup

1. **Navigate** to the Flask folder:
   ```bash
   cd path/to/your/project/flask-app
   ```
2. (Optional) **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate   # (Linux/Mac)
   # or on Windows:
   venv\Scripts\activate
   ```
3. **Install** dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) **Set up environment variables** (e.g., in a `.env` file).

### 3.3 Running the Application

- **Local Development**:

  ```bash
  python app.py
  ```

  or

  ```bash
  flask run
  ```

  The app will run on [http://127.0.0.1:5000](http://127.0.0.1:5000).

- **Production**:
  Use a WSGI server (e.g., Gunicorn):
  ```bash
  gunicorn app:app
  ```

---

## 4. Part 3 Ranking Algorithm

- Reads an Excel file (⁠ SampleInput_Part3.xlsx ⁠) where each row is a poster and each column is a judge's score.
  - Interprets _0_ as "not reviewed" (meaning the judge did not score that poster).
  - Applies a "supercharged" Z-score approach:
    - Winsorizes (clips) extreme outliers for each judge at the 5th and 95th percentile.
    - Ignores 0 values (does not impute them).
    - Computes each judge's mean and std dev only from non-zero scores.
    - Converts each non-zero cell to a z-score.
    - Sums the z-scores across the judges for each poster.
    - Sorts the posters from highest to lowest z-sum, producing a final rank order.

### 4.1 Prerequisites

- **Python 3.8+**
- Libraries such as **pandas**, **numpy**, and **openpyxl**

### 4.2 Installation & Setup

1. **Navigate** to the Part 3 folder:
   ```bash
   cd path/to/your/project/Part3
   ```
2. (Optional) **Create/Activate** a virtual environment.
3. **Install** dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 4.3 Running the Ranking Algorithm

1. **Ensure** your input Excel file (e.g., `SampleInput_Part3.xlsx`) is in the Part 3 folder.
2. **Run** the script:
   ```bash
   python ECS_Challenge_Part3.py
   ```
3. The script will:
   - Read the Excel file (with columns such as `Poster`, `J1`, `J2`, `J3`, etc.).
   - Treat **0** as “not reviewed” and skip those cells.
   - Winsorize outlier scores, compute z‐scores for each judge’s reviews, and sum them for each poster.
   - **Print** a final ranked list (from best to worst).

---

## 5. Additional Notes

- If the **Next.js** and **Flask** apps communicate, ensure the correct **API URLs** and endpoints are set in both.
- For **Part 1**, you can adjust weights (e.g., `dept_weight` and `sim_weight`) to fine-tune the compatibility scoring.
- For **Part 3**, you can tweak winsorizing thresholds, the `epsilon` value, or add weighting factors.
- Check each folder’s own **README** (if available) for further details or usage examples.

---

## 6. Contact / Support

If you have questions or encounter issues, please reach out to:

- **[Suved Ganduri]**
- **[Rangel Koli]**
- **[Saad Shah]**

- **[sganduri@syr.edu]**
- **[rakolii@syr.edu]**
- **[sshah62@syr.edu]**

Thank you for using this project!

```


```
