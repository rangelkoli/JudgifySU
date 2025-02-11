from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import pulp
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/scoring-posters/*": {
        "origins": [os.getenv('CORS_ORIGIN')],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)


# Add these functions after your process_excel function
@app.route('/upload-to-supabase', methods=['POST'])
def upload_to_supabase():
    try:
        # Read the generated CSV files
        poster_assignments = pd.read_csv("posters_with_judges_specter.csv")
        judge_assignments = pd.read_csv("judges_with_posters_specter.csv")
        print("asds")
        # Upload papers data    
        papers_data = []
        for _, row in poster_assignments.iterrows():
            if pd.notna(row['Title']):  # Skip rows without a poster number
                paper = {
                    'title': row['Title'],  # Adjust column name if different
                    'poster_number': row['Poster #']
                }
                papers_data.append(paper)
        print("Done")
        print(papers_data)
        # Batch insert papers
        if papers_data:
            response = supabase.table('papers').insert(papers_data).execute()
            print("Papers uploaded successfully")

        # Upload users (judges) data
        users_data = []
        for _, row in judge_assignments.iterrows():
            # Get all assigned posters for this judge (removing None/NaN values)
            posters = [int(row[f'poster-{i}']) for i in range(1, 7) if pd.notna(row[f'poster-{i}']) and not pd.isna(row[f'poster-{i}'])]
            first_initial = row['Judge FirstName'][0].upper()
            last_two = row['Judge LastName'][:2].upper()
            random_digits = ''.join(pd.Series(np.random.randint(0, 10, 2)).astype(str))
            code = f"{first_initial}{last_two}{random_digits}"
            user = {
                'code': code,  # Assuming 'Judge' is the code
                'first_name': row['Judge FirstName'],
                'last_name': row['Judge LastName'],
                'role': 'judge',
                'posters': posters
            }
            users_data.append(user)
        
        # Batch insert users
        if users_data:
            response = supabase.table('users').insert(users_data).execute()
            print("Users uploaded successfully")

        return jsonify({
            'message': 'Data uploaded to Supabase successfully',
            'papers_count': len(papers_data),
            'users_count': len(users_data)
        }), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/process-excel', methods=['POST'])
def process_excel():
    try:
        # Check if files are present in request
        if 'file1' not in request.files or 'file2' not in request.files:
            return jsonify({'error': 'Both files are required'}), 400

        file1 = request.files['file1']
        file2 = request.files['file2']
        print(file1)
        print(file2)
        file1.save('judges.xlsx')
        file2.save('posters.xlsx')
        print("SAVED")
                # Load the CSV files
        # judges_df = pd.read_excel('judges.xlsx', engine='openpyxl')
        judges_df = pd.read_excel('judges.xlsx')
        posters_df = pd.read_excel('posters.xlsx', engine='openpyxl')
        research_expertise = pd.read_csv('final_expertise.csv')
        print(judges_df)
        print(posters_df)
        print(research_expertise)
        # ----- Preprocess Judges Data -----
        # Ensure text fields are cleaned and filled
        print("ASdasd")

        judges_df['Judge FirstName'] = judges_df['Judge FirstName'].astype(str).str.strip()
        judges_df['Judge LastName'] = judges_df['Judge LastName'].astype(str).str.strip()
        judges_df['Judge'] = judges_df['Judge'].astype(str).str.strip()
        # Create a full name for each judge (for advisor conflict checking)
        judges_df['JudgeFullName'] = judges_df['Judge FirstName'] + " " + judges_df['Judge LastName']
        print(judges_df)
        # Ensure Research_Expertise is a string and fill missing values
        judges_df = pd.merge(judges_df, research_expertise[['JudgeFullName', 'Summary']], on='JudgeFullName', how='left')
        print(judges_df)
        judges_df['Research_Expertise'] = judges_df['Summary'].fillna("").astype(str).str.strip()
        # Map the "Hour available" into a list of available time slots.
        def map_hour_available(val):
            val = str(val).strip().lower()
            if val == 'both':
                return [1, 2]
            elif val == '1':
                return [1]
            elif val == '2':
                return [2]
            else:
                return [1, 2]  # Default if unexpected
        judges_df['AvailableHours'] = judges_df['Hour available'].apply(map_hour_available)
        print(judges_df)
        # ----- Preprocess Posters Data -----
        # Ensure the Abstract field is a string and fill missing values
        posters_df['Abstract'] = posters_df['Abstract'].fillna("").astype(str).str.strip()
        # Create full advisor names (fill missing values to avoid errors)
        posters_df['Advisor FirstName'] = posters_df['Advisor FirstName'].fillna("").astype(str).str.strip()
        posters_df['Advisor LastName'] = posters_df['Advisor LastName'].fillna("").astype(str).str.strip()
        posters_df['AdvisorFullName'] = posters_df['Advisor FirstName'] + " " + posters_df['Advisor LastName']

        # Compute poster time slots: odd poster number → 1, even → 2.
        posters_df['TimeSlot'] = posters_df['Poster #'].apply(lambda x: 1 if x % 2 == 1 else 2)

        # ----- Map Program to Department using a Manual Keyword Dictionary -----
        department_keywords = {
            "MAE": ["mechanical", "aerospace", "manufacturing", "robotics", "automation"],
            "BMCE": ["biomedical", "medicine", "health", "biomechanical", "bioengineering", "chemical"],
            "CEE": ["civil", "environmental", "structural", "geotechnical", "infrastructure"],
            "EECS": ["electrical", "computer", "electronics", "computing", "information", "cyber"]
        }

        def map_program_to_department(program_str):
            text = str(program_str).lower()
            for dept, keywords in department_keywords.items():
                for kw in keywords:
                    if kw in text:
                        return dept
            return "Unknown"

        # Apply the mapping function to create a new column in posters_df.
        posters_df['MappedDepartment'] = posters_df['Program'].apply(map_program_to_department)

        # Create lists of judge IDs and poster numbers
        judge_ids = judges_df['Judge'].tolist()
        poster_numbers = posters_df['Poster #'].tolist()
        print(judge_ids)
        print(poster_numbers)

        # =============================================================================
        # STEP 1: Compute Compatibility Using AllenAI SPECTER
        # =============================================================================
        # Use SPECTER—a SciBERT-based model fine-tuned for scientific documents.
        # (Make sure you have installed the sentence-transformers package.)
        model = SentenceTransformer("allenai-specter")

        # Get the texts for embedding (assume these columns have been preprocessed in Step 0)
        # For judges, we use their Research_Expertise text.
        judge_texts = judges_df['Research_Expertise'].tolist()
        # For posters, we use the Abstract.
        poster_texts = posters_df['Abstract'].tolist()

        # Compute embeddings for judges and posters (as NumPy arrays)
        judge_embeddings = model.encode(judge_texts, convert_to_tensor=False)
        poster_embeddings = model.encode(poster_texts, convert_to_tensor=False)

        # Compute pairwise cosine similarity between each judge's expertise and each poster's abstract.
        semantic_sim_matrix = cosine_similarity(judge_embeddings, poster_embeddings)
        print("Semantic Similarity Matrix Shape:", semantic_sim_matrix.shape)

        # Define weights for combining department matching and semantic similarity.
        # Here, dept_weight is applied to the binary department match,
        # and sim_weight is applied to the semantic similarity.
        dept_weight = 0.5
        sim_weight = 0.5

        # Build a compatibility dictionary for each (judge, poster) pair.
        # (Assume that in Step 0 you have created the manual mapping:
        #   - posters_df['MappedDepartment'] via your manual keyword dictionary,
        #   - and judges_df has a 'Department' column.)
        compatibility = {}
        for i, judge in enumerate(judge_ids):
            # Get judge's department (normalized to uppercase)
            dept_judge = judges_df.loc[judges_df['Judge'] == judge, 'Department'].iloc[0].strip().upper()
            for j, poster in enumerate(poster_numbers):
                # Get the poster's mapped department (normalized to uppercase)
                poster_dept = posters_df.loc[posters_df['Poster #'] == poster, 'MappedDepartment'].iloc[0].strip().upper()
                # Binary department match: 1 if equal, 0 otherwise.
                dept_match = 1 if dept_judge == poster_dept else 0
                # Retrieve the semantic similarity score from SPECTER.
                sim_score = semantic_sim_matrix[i, j]
                # Combine the two scores.
                compatibility[(judge, poster)] = dept_weight * dept_match + sim_weight * sim_score
        print("Compatibility Scores Computed.")
        # =============================================================================
        # STEP 2: Build the PuLP Optimization Model
        # =============================================================================

        # Create a maximization problem.
        prob = pulp.LpProblem("Poster_Judge_Assignment", pulp.LpMaximize)

        # Define binary decision variables: assign_vars[(j, p)] = 1 if judge j is assigned to poster p.
        assign_vars = pulp.LpVariable.dicts(
            "assign",
            [(j, p) for j in judge_ids for p in poster_numbers],
            cat=pulp.LpBinary
        )

        # Constraint 1: Each poster must be assigned exactly 2 judges.
        for p in poster_numbers:
            prob += pulp.lpSum([assign_vars[(j, p)] for j in judge_ids]) == 2, f"Poster_{p}_assignment"

        # Constraint 2: Each judge reviews at most 6 posters.
        for j in judge_ids:
            prob += pulp.lpSum([assign_vars[(j, p)] for p in poster_numbers]) <= 6, f"Judge_{j}_limit"

        # Constraint 3: Time Slot Availability.
        # A judge can only review a poster if the poster's time slot is in the judge's AvailableHours.
        for idx_j, row_j in judges_df.iterrows():
            j = row_j['Judge']
            available_hours = row_j['AvailableHours']
            for idx_p, row_p in posters_df.iterrows():
                p = row_p['Poster #']
                poster_time = row_p['TimeSlot']
                if poster_time not in available_hours:
                    prob += assign_vars[(j, p)] == 0, f"TimeSlot_j{j}_p{p}"

        # Constraint 4: Advisor Conflict.
        # A judge should not be assigned to a poster if the judge is also the advisor.
        for idx_j, row_j in judges_df.iterrows():
            j = row_j['Judge']
            judge_full = row_j['JudgeFullName'].lower().strip()
            for idx_p, row_p in posters_df.iterrows():
                p = row_p['Poster #']
                advisor_full = row_p['AdvisorFullName'].lower().strip()
                if judge_full == advisor_full:
                    prob += assign_vars[(j, p)] == 0, f"AdvisorConflict_j{j}_p{p}"

        # Objective: Maximize total compatibility score.
        prob += pulp.lpSum(
            compatibility[(j, p)] * assign_vars[(j, p)] for j in judge_ids for p in poster_numbers
        ), "Total_Compatibility"
        print("Optimization Model Built.")
        # =============================================================================
        # STEP 3: Solve the Optimization Model
        # =============================================================================

        # Use the CBC solver (via COIN_CMD) with the appropriate path.
        solver = pulp.COIN_CMD(path=os.getenv('CBC_SOLVER_PATH'))
        result_status = prob.solve(solver)
        print("Solver Status:", pulp.LpStatus[prob.status])

        # =============================================================================
        # STEP 4: Generate and Save Output Files
        # =============================================================================

        # (A) Extended Poster File: Add columns 'judge-1' and 'judge-2'.
        poster_assignments = posters_df.copy()
        poster_assignments['judge-1'] = None
        poster_assignments['judge-2'] = None

        for idx, row in poster_assignments.iterrows():
            p = row['Poster #']
            assigned_judges = [j for j in judge_ids if pulp.value(assign_vars[(j, p)]) == 1]
            if len(assigned_judges) >= 1:
                poster_assignments.at[idx, 'judge-1'] = assigned_judges[0]
            if len(assigned_judges) >= 2:
                poster_assignments.at[idx, 'judge-2'] = assigned_judges[1]

        poster_assignments.to_csv("posters_with_judges_specter.csv", index=False)
        print("Extended Poster File saved as 'posters_with_judges_specter.csv'.")

        # (B) Extended Judge File: List up to 6 poster assignments for each judge.
        judge_assignments = judges_df.copy()
        for i in range(1, 7):
            judge_assignments[f'poster-{i}'] = None

        for idx, row in judges_df.iterrows():
            j = row['Judge']
            assigned_posters = [p for p in poster_numbers if pulp.value(assign_vars[(j, p)]) == 1]
            for k, p in enumerate(assigned_posters):
                judge_assignments.at[idx, f'poster-{k+1}'] = p

        judge_assignments.to_csv("judges_with_posters_specter.csv", index=False)
        print("Extended Judge File saved as 'judges_with_posters.csv'.")

        # (C) Assignment Matrix File: Rows = posters; Columns = judges; cell = 1 if assigned, else 0.
        assignment_matrix = pd.DataFrame(0, index=poster_numbers, columns=judge_ids)
        for p in poster_numbers:
            for j in judge_ids:
                assignment_matrix.at[p, j] = int(pulp.value(assign_vars[(j, p)]))
        assignment_matrix.to_csv("assignment_matrix.csv")
        print("Assignment Matrix File saved as 'assignment_matrix.csv'.")

        

        return jsonify({'message': 'Files processed successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/scoring-posters/', methods=['POST'])
def scoring_posters():
    """
    Part 3 "Supercharged" Z-score approach WITHOUT imputing 0.
    - 0 means "not reviewed". We skip those cells entirely.
    - For each judge's column:
        1) Winsorize the non-zero values (5th & 95th percentile).
        2) Compute mean & std from the non-zero values.
        3) Convert only the non-zero cells to z-scores. Zero cells remain NaN in the z-score DataFrame.
    - Finally, sum each poster's z-scores (ignoring NaN) => final rank.
    """
    # Check if files are present in request

    file1 = request.files['file']
    file1.save('main_scores.xlsx')

    df = pd.read_excel('main_scores.xlsx')
    print(df)
    
    # Get the poster titles from the Excel file
    titles_df = pd.read_excel('posters.xlsx')[['Poster #', 'Title']]
    print(titles_df)
    # Identify judge columns (assuming columns named J1, J2, J3, etc.)
    judge_cols = df.columns[1:].tolist()
    print(judge_cols)
    print(len(judge_cols))
    # We'll keep a parallel DataFrame "z_df" for storing z-scores
    z_df = pd.DataFrame()
    z_df["Poster"] = df["Poster"]

    # Set a small epsilon for std dev floor
    epsilon = 0.5

    # For each judge column, process only the nonzero (reviewed) scores.
    for col in judge_cols:
        print(col)
        # Extract the non-zero values
        non_zero_mask = (df[col] != 0)  # True where the judge actually reviewed
        non_zero_vals = df.loc[non_zero_mask, col].astype(float)
        print(non_zero_vals)


        if len(non_zero_vals) > 1:
            # 1) Winsorize at [5th, 95th]
            p5 = np.percentile(non_zero_vals, 5)
            p95 = np.percentile(non_zero_vals, 95)
            clipped = non_zero_vals.clip(lower=p5, upper=p95)
            print(clipped)
            # 2) Compute mean & std of clipped
            col_mean = clipped.mean()
            col_std = clipped.std(ddof=0)  # population std or ddof=1 for sample
            if col_std < epsilon:
                col_std = epsilon

            # Create a new column in z_df for this judge's z-scores,
            # initialize to NaN
            z_df[col] = np.nan

            # 3) Convert these non-zero cells to z-scores
            z_scores = (clipped - col_mean) / col_std
            print(clipped, col_mean, col_std)
            print(z_scores)
            # Place these z-scores back into z_df
            for idx, z_val in z_scores.items():
                z_df.at[idx, col] = z_val

        else:
            # If there's 0 or 1 non-zero data point, we can't do meaningful winsorizing or std dev
            # In that case, let's just set z-scores to NaN for all, or 0 if we prefer
            # We'll store NaN to indicate "insufficient data"
            z_df[col] = np.nan

    # Now z_df has NaN for any cell that was 0 or if there wasn't enough data for that judge
    # Posters typically have 2 judges => 2 non-NaN z-scores each, others are NaN.

    # 4) Sum each poster's z-scores across the judge columns, ignoring NaN
    z_df["Z_Sum"] = z_df[judge_cols].sum(axis=1, skipna=True)
    print(z_df)
        # 5) Sort by descending Z_Sum
    Z_min = z_df["Z_Sum"].min()
    Z_max = z_df["Z_Sum"].max()
    # 6) Print final rank order

    def scale_to_ten(z):
        if Z_max == Z_min:
            # If all values are the same, just give everyone a 10 or 5, your choice
            return 5.0
        return 10.0 * (z - Z_min) / (Z_max - Z_min)
    z_df["ScaledScore_0_10"] = z_df["Z_Sum"].apply(lambda x: scale_to_ten(x) if pd.notna(x) else np.nan)
    z_df.sort_values("ScaledScore_0_10", ascending=False, inplace=True)
    # Save the z_df DataFrame to Excel
    z_df.to_excel('final_scores.xlsx', index=False)
    print("=== FINAL RANKING (Best to Worst) ===\n")
    rank = 1

    winners = []
    top_3 = []
    other_posters = []
    rank = 1

    for _, row in z_df.iterrows():
        poster_id = row["Poster"]
        score_sum = row["ScaledScore_0_10"] if not pd.isna(row["ScaledScore_0_10"]) else 0
        
        # Get the title for this poster
        poster_title = titles_df[titles_df['Poster #'] == poster_id]['Title'].iloc[0]
        
        poster_data = {
            "rank": rank,
            "poster_id": int(poster_id),
            "title": poster_title,
            "score": round(float(score_sum), 2)
        }
        
        if rank <= 3:
            top_3.append(poster_data)
        else:
            other_posters.append(poster_data)
        
        rank += 1
    
    winners = {
        "top_3": top_3,
        "other_posters": other_posters
    }
    print(winners)
    return jsonify({
        'message': 'Files processed successfully', 
        'winners': winners
    }), 200



if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true', port=5000, host="0.0.0.0")
