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
    role="Academic Research Analyst",
    goal="Conduct comprehensive analysis of professor's research publications, citations, and academic contributions",
    backstory="""Expert in analyzing academic publications and research impact. Specialized in 
    identifying key research areas, notable publications, and scholarly contributions from 
    academic databases and research papers.""",
    llm="gemini/gemini-1.5-flash",
    tools=[SerperDevTool(
            search_url="https://google.serper.dev/scholar",
    )],
)

prof_research_task = Task(
    description="""Analyze {judge_name}'s research profile:
    1. Find and analyze their key research publications
    2. Identify main research areas and subspecialties
    3. Note significant research contributions and breakthroughs
    4. Look for recent research trends and ongoing work
    5. Identify collaborations and research groups
    
    Organize the findings into a detailed summary of their expertise.""",
    agent=prof_research_agent,
    expected_output="""Provide a detailed analysis in this format:
    1. Core Research Areas: [List main areas of expertise]
    2. Key Publications: [List 2-3 most significant papers with brief impact]
    3. Research Focus: [Detailed description of their specific expertise]
    4. Recent Work: [Current research directions]
    5. Notable Contributions: [Significant findings or breakthroughs]""",
    verbose=True,
    output_file="professor_research_analysis.txt",
)

@rate_limit
async def get_professor_expertise(judge_row: dict) -> str:
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
        print(f"Error processing judge {judge_row.get('Judge FirstName', '')} {judge_row.get('Judge LastName', '')}: {str(e)}")
        return "Error occurred while processing"
