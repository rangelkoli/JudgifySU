import os
from crewai import Agent, Task, Crew, LLM
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from crewai_tools import SerperDevTool
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Type
from rate_limiter import rate_limit
import asyncio

os.environ["OPENAI_API_KEY"] = "sk-proj-1111"
os.environ["GEMINI_API_KEY"] = "AIzaSyANKBsYWdphE_m2lAII5CV3b2ySLP6a9QI"
os.environ["SERPER_API_KEY"] = "f9abe9912b267145d315e3aa9d64f77e22402331"


prof_research_agent = Agent(
    role="Research Impact Specialist",
    goal="Analyze professor's research influence, methodologies, and technical expertise",
    backstory="""Expert in evaluating research methodologies, technical expertise, and 
    practical applications of academic work. Specialized in connecting theoretical research 
    to practical implications and identifying unique expertise areas.""",
    llm="gemini/gemini-1.5-flash",
    tools=[SerperDevTool(
            search_url="https://google.serper.dev/scholar",
    )],
)

prof_research_task = Task(
    description="""Investigate {judge_name}'s research expertise from department:
    1. Analyze their research methodologies and techniques
    2. Identify specialized equipment or tools they work with
    3. Look for patents and practical applications of their research
    4. Find interdisciplinary connections in their work
    5. Examine funding grants and research projects
    
    Create a comprehensive profile of their technical expertise.""",
    agent=prof_research_agent,
    expected_output="""Provide a detailed technical analysis in this format:
    1. Technical Expertise: [Specific methodologies and techniques]
    2. Research Applications: [Practical applications and patents]
    3. Specialized Knowledge: [Unique tools or approaches used]
    4. Interdisciplinary Impact: [Connections to other fields]
    5. Active Projects: [Current research initiatives and grants]""",
    verbose=True,
    output_file="professor_technical_analysis.txt",
)

@rate_limit
async def get_professor_background(judge_row: dict) -> str:  # Different function name
    try:
        # Add exponential backoff for retries
        max_retries = 3
        for attempt in range(max_retries):
            try:
                full_name = f"{judge_row['Professor Name']}"
                inputs = {
                    'judge_name': full_name,
                }
                
                crew = Crew(
                    agents=[prof_research_agent],
                    tasks=[prof_research_task],
                    verbose=True,
                )
                
                result = crew.kickoff(inputs=inputs)
                return result
                
            except Exception as e:
                if "rate limit" in str(e).lower():
                    if attempt < max_retries - 1:
                        wait_time = (2 ** attempt) * 10  # Exponential backoff
                        await asyncio.sleep(wait_time)
                        continue
                raise e
                
    except Exception as e:
        print(f"Error processing professor {judge_row.get('Professor Name')}: {str(e)}")
        return "Error occurred while processing"
