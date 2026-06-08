# Smart Grade Bridge
The Smart Grade Bridge application holds the purpose of automating parts of the grading process at unviersities. Due to security concerns, the university had denied us access administrative access to both Canvas Instructor and PeopleSoft (my.csusm.edu).
Instead of focusing on the automation process from Canvas to PeopleSoft, we focused on the repetitive grading process for ABET (more info below). 

### Note:
This project is duplicated from the original SGB repository with a few tweaks. As a result, the majority of commits, branches, and merges do not show here.
This project is a modified version of SGB that has an additional web application used for troubleshooting purposes. It also has the backend running on a Render server so it is not run locally.
The `Proposal Summary` is posted below.

# About ABET
ABET (ABETter) is a web application the the Deptartment Chair of Comptuer Science and Engineering at CSUSM had created to help the university maintain its engineering accredidation. On this web app, the faculty can submit and create class evaluations based on the accredidation needs through rubrics. These rubrics are manually created here, then manually copied over to Canvas. This is the problem the Smart Grade Bridge team solves.

# Proposal Summary
### Problem Statement:
California State University San Marcos faculty currently spend hundreds of hours each semester manually transferring grades and assessment data between three critical systems: Canvas (Learning Management System), Oracle PeopleSoft (official transcript system), and ABET accreditation tooling. This manual process is time-consuming, error-prone, and represents a significant operational inefficiency across the university.

### Learning Opportunities:
Students will gain hands-on experience with enterprise system integration, API development, secure data handling, real-world software engineering practices, and the satisfaction of solving a problem that directly impacts their university community.

### Project Goals:
Develop an automated integration platform that addresses two critical data gaps:
- Seamless grade transfer from Canvas to Oracle PeopleSoft for official transcript recording
- Automated export of detailed rubric scores from Canvas to ABET tooling for engineering accreditation compliance

### Expected Outcomes:
- A secure, reliable system that automates grade data transfer between Canvas and PeopleSoft
- A module that extracts and formats rubric-level assessment data for ABET reporting requirements
- Comprehensive documentation for system maintenance and future enhancements
- Measurable reduction in faculty time spent on grade transcription (targeting 80%+ time savings)
- Significant reduction in transcription errors

### Technical Scope:
Students will work with Canvas LMS APIs, Oracle PeopleSoft integration points, and ABET data formatting requirements. The project will involve API development, data transformation, secure authentication handling, error detection and logging, and user interface design for monitoring and manual intervention when needed.
