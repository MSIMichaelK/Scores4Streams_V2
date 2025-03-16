# 1. Project Overview

## Purpose: 
This application is designed to provide a comprehensive solution for scoring Softball and Baseball games through mobile devices (smartphones and tablets) and to facilitate the real-time updating of scoreboard overlays. These overlays can be accessed on the same device or remotely, making them ideal for inclusion in live streams or for display on larger screens.

### Key Objectives
- Scoring and Live Updates: Enable users to score games live and update scoreboards in real time for broadcast on a video livestream, on a large screen display at the game or on any approved game subscribers device.

- Historical Data Management: Collect and store game statistics in a centralized database to support detailed reporting on games, seasons, leagues, and player performances. This repository will also serve as the master record for players, teams, leagues, tournaments, and seasons.

- Open Data Access: Unlike existing solutions that often lock scoreboard overlays to specific streaming platforms and restrict data access, this app will champion open data principles. Users will own their data and have the freedom to use it across platforms without restrictions, leveraging APIs for enhanced interoperability.

- Future Livestream Integration: While initial versions will focus on scoring and data management, future enhancements could include integrating scoring data with live video streams to generate highlights and detailed gameplay analytics automatically. 

- Initially the Application Scoreboard overlay will support popular streaming setups like Mevo Multicam and Streamlabs, both of which utilize OBS for multi-streaming capabilities to platforms such as Facebook and YouTube.

### Functionality:
- Database Interaction: Efficiently save and retrieve historical statistics and player information, supporting comprehensive data analytics over time.

- Data Security with Sharing Capabilities: While ensuring strict data security and privacy for each user, the application will also facilitate selective data sharing to enhance the communal viewing and analytical experience.

- Multi-Tenancy: Designed to securely manage data across multiple tenants, allowing distinct data access and interaction as governed by user roles and permissions.

- Cross-Platform Compatibility: Initially developed as a mobile-first web application, plans are in place to extend functionality to iOS and Android native apps, broadening user access and engagement.

### External Integrations:
- API Connectivity: Integrate with other scoring applications through their APIs to enrich data inputs and outputs, enhancing the application’s utility and flexibility.
- In future integrate with livestream platforms to link game statistics with video footage
- In future integrate with music platforms to provide walk on music clips and other gameplay event music clips.

## Scope: 
This document covers the development and deployment of a mobile-first web application aimed at scoring and broadcasting Softball and Baseball game data. The application will:

- Allow real-time game scoring and updates.
- Provide a customizable and embeddable scoreboard overlay for live streaming and public displays.
- Store game, player, and team statistics for historical analysis and future access.
- Facilitate secure and selective data sharing across different platforms and users.
- Integrate with external APIs from existing scoring and streaming platforms to enhance functionality.

Exclusions:

- The initial release will not support native iOS or Android applications; these are planned for future updates.
- Direct video streaming integration and automatic highlight generation will not be included in the initial phases.

# Definitions and Acronyms: 
API - Application Programming Interface: A set of rules that allow different software entities to communicate with each other.

OBS - Open Broadcaster Software: A free and open-source software for video recording and live streaming.

Multi-Tenancy - A software architecture where a single instance of software runs on a server and serves multiple tenants (users or groups of users).

Livestream - A live broadcast of video and audio over the internet.

Mevo Multicam - A live streaming camera setup that allows users to control multiple camera feeds in real time. The mevo platform is owned by Logitech as is teh Streamlabs platform which is utilised in teh premium features of the mevo Multicam application.

Streamlabs - A streaming software used for online broadcasting, particularly popular with gamers for its integration capabilities with platforms like Twitch, YouTube, and Facebook.


# 2. Application Architecture
## Technology Stack:
### Frontend
- Primary Technology: React
    - Rationale: React is chosen for its efficiency and responsiveness, particularly useful for the real-time nature of live scoring applications. Its component-based architecture makes it scalable and maintainable. Future Consideration: React Native for developing native iOS and Android applications, leveraging the same codebase for mobile platforms to reduce development time and increase maintainability.

### Backend
- Database: Firestore
    - Rationale: Firestore is a flexible, scalable NoSQL database that offers real-time data synchronization across user devices, making it ideal for a real-time scoring app. Its cloud-native nature simplifies the scaling process and integrates seamlessly with other Firebase services.
- Authentication and Backend Services: Firebase
    - Rationale: Firebase provides a comprehensive suite of backend services including user authentication, hosting, and storage services. The integrated authentication module supports secure access and multi-tenancy capabilities crucial for user data segregation.

### Additional Tools
- Version Control: GitHub
    - Rationale: GitHub is utilized for source code management and version control. It supports collaborative development and is integrated with various CI/CD pipelines, enhancing continuous development and deployment practices.
- Integrated Development Environment (IDE): Visual Studio Code (VSCode)
    - Rationale: VSCode is a lightweight, powerful source code editor that supports development in JavaScript and React. It offers powerful plugins and integrations for Firebase and other web technologies.
- Containerization: Docker (Consideration for future integration)
    - Rationale: Docker can be used to containerize the development environment, ensuring consistency across various development and production environments. This is particularly beneficial when scaling up the application or porting between different environments.

### Hosting and Deployment
- Current Setup: Local development instances are used for initial development and testing phases.
- Deployment Plan: Transition to Firestore hosting for scalable, secure, and efficient cloud hosting. Firestore hosting provides automatic scaling and seamless integration with Firestore database services.
- Future Scalability and Deployment Considerations:
    - Evaluate the integration of Google Cloud Platform (GCP) services for enhanced computational needs, data analytics, and machine learning capabilities.
    - Implement CI/CD pipelines using GitHub Actions to automate testing and deployment processes, ensuring high reliability and faster rollout of features.

### High Level Architecture
![High-Level Architecture Diagram](/diagrams/Scores4Streams_HA.png)

### Component Descriptions
- **Login/Register UI**: Authentication interfaces where users can log in or register new accounts. These interfaces communicate with Firebase Authentication Service for secure user authentication and management.

- **Dashboard UI**: Serves as the main interface for authenticated users, providing access to default scoreboards, game statistics, and admin functions.

- **Controller UI**: The primary interface for scorers to set up and score games. It links directly with the Game Play State & Logic for real-time data handling.

- **Scoreboard Overlay UI**: Displays the live scoreboard, which can be overlaid on a livestream or shown on a display. It retrieves live gameplay data from the Firebase RealTime Store or from a historical game stored in the historical .

- **Admin UI**: Allows administrative users to manage various application settings and perform admin-level functions.

- **Statistics UI**: Enables access to historical game statistics and the setting up of new players, teams, seasons, leagues, and tournaments. It interacts with the Firebase Database where historical data is stored.

- **Game Play State & Logic**: Represents the core logic of the game state, separated from the presentation layer, ensuring clean architecture and ease of updates or modifications.

- **Firebase Services**:
  - **Authentication Service and User Store**: Manages user accounts and authenticates user sessions.
  - **RealTime Store for Live Gameplay Data**: Synchronizes live game data in real-time across user devices.
  - **Firebase Database**: Stores long-term historical statistics and master data of players, teams, leagues, and tournaments.

## Hosting and Deployment
The application is developed locally but with a live Firestore instance for Authentication, realktime and DB with plans to migrate to Firestore hosting for a scalable and robust production environment.

# 3. Functional Requirements
## User Roles:
User roles within the application dictate the access levels and capabilities that each user has. The system will have a role-based access control (RBAC) model to ensure users only have access to the appropriate features and data.

### Scorer
#### Responsibilities:
Input real-time game data including scores, player statistics, and other relevant events during a game.
Set up games, including details such as team names, player rosters, and game settings.
Manage live game states, including start, pause, and end game functions.

#### Permissions:
Access to the Controller UI for game setup and live scoring.
Ability to send updates to the Scoreboard Overlay UI.
Rights to view and input live game data in the Firebase RealTime Store.

### Viewer
#### Responsibilities:
View live scores and game statistics through the Scoreboard Overlay UI.
Access various scoreboard displays, including streams on external platforms.

#### Permissions:
View-only access to the live and historical data relevant to public displays.

### Administrator
#### Responsibilities:
Manage user accounts and permissions.
Configure application settings and manage integrations with external APIs and services.
Access and manage all administrative functions within the Admin UI.

#### Permissions:
Full access to Admin UI for performing administrative tasks.
Ability to manage Scorer accounts and permissions.
Oversee data integration and synchronization tasks.

### Statiscian
#### Responsibilities (Consider this role if you plan to include detailed statistical analysis within your application):
Analyze game statistics and generate reports.
Review historical data for trends and insights.
Curate statistical data for sharing with teams, leagues, or media outlets.

#### Permissions:
Access to detailed historical data within the Firebase Database.
Use of Statistics UI for generating and exporting reports.

### Super User
#### Responsibilities:
A Super User may be a role reserved for developers or IT support staff who need to access all parts of the system for maintenance, updates, and troubleshooting.

#### Permissions:
Unrestricted access to all UI components and backend services.
Ability to modify game play state and logic for debugging or enhancement purposes.

### Guest
#### Responsibilities:
Limited interaction with the application, possibly for promotional or trial purposes.

#### Permissions:
Restricted access to certain UI components like the public Scoreboard Overlay UI.
No access to administrative or sensitive game data.

### Player
#### Responsibilities:
- View personal statistics across multiple teams, seasons, tournaments.
- Manage personal profile details including profile image and walk-out audio snippet.

#### Permissions:
- Read-only access to own data across all affiliated teams.

### Family Member/Fan
#### Responsibilities:
- Follow specific player(s) to view player statistics and gameplay updates.

#### Permissions:
- Read-only access to followed player's data.
- Ability to customize notifications explicitly for game-related player events (game start/end, scoring events, player-specific events).

## Core Features:
### Scoring Interface:
#### Detail: 
Intuitive and responsive interface for inputting and modifying scores and player statistics during games.

#### User Flow
This is a high level overview of how teh scorer will record gameplay events

flowchart TD
    Start["Start Game"] --> NewInning["New Inning"]
    NewInning --> Pitch["Pitch Thrown"]
    Pitch --> Outcome{"Outcome of Pitch"}
    Pitch -- Optional: Record Pitch Type --> PT{"Identify Pitch Type"}
    PT -- Fastball --> PTF["PTF"]
    PT -- Curveball --> PTC["PTC"]
    PT -- Slider --> PTS["PTS"]
    PT -- Changeup --> PTCU["PTCU"]
    PT -- Other --> PTO["PTO"]
     PTF --> PitchLocation
    PTC --> PitchLocation
    PTS --> PitchLocation
    PTCU --> PitchLocation
    PTO --> PitchLocation 
    PitchLocation --> Outcome
    Outcome -- Ball --> BallCount["Increment Ball Count"]
    Outcome -- Strike --> StrikeCount["Increment Strike Count"]
    Outcome -- Foul --> Foul["Foul Hit"]
    Outcome -- In Play --> InPlay["Ball In Play"]
    Outcome -- Hit by Pitch --> Walk["Walk Batter"]
    BallCount -- 4 Balls --> Walk
    StrikeCount -- 3 Strikes --> StrikeOut["Strike Out Batter"]
    Foul --> RecordFoul["Record Foul Location"]
    InPlay --> HitType{"Determine Hit Type"}
    HitType -- Fly Ball --> FlyBall["Fly Ball"]
    HitType -- Line Drive --> LineDrive["Line Drive"]
    HitType -- Ground Ball --> GroundBall["Ground Ball"]
    HitType -- Bunt --> Bunt["Bunt"]
    HitType -- Pop Fly --> PopFly["Pop Fly"]
    FlyBall --> FBLocation{"Decide Fly Ball Location"}
    LineDrive --> LDLocation{"Decide Line Drive Location"}
    GroundBall --> GBLocation{"Decide Ground Ball Location"}
    Bunt --> BuntLocation{"Decide Bunt Location"}
    PopFly --> PFLocation{"Decide Pop Fly Location"}
    FBLocation -- Caught --> FBCaught["Fly Ball Caught"]
    FBLocation -- Dropped --> Error["Error by Fielder"]
    LDLocation -- Caught --> LDCaught["Line Drive Caught"]
    LDLocation -- Missed --> Error
    GBLocation -- Fielded --> GBOutcome{"Ground Ball Outcome"}
    GBLocation -- Missed --> Error
    BuntLocation -- Fielded --> BOutcome{"Bunt Outcome"}
    BuntLocation -- Missed --> Error
    PFLocation -- Caught --> PFCaught["Pop Fly Caught"]
    PFLocation -- Dropped --> Error
    FBCaught -- "Runner Tags?" --> FBCaughtTag["Runner Tags Up"]
    LDCaught -- "Runner Tags?" --> LDCaughtTag["Runner Tags Up"]
    PFCaught -- "Runner Tags?" --> PFCaughtTag["Runner Tags Up"]
    FBCaughtTag -- "Out at Next Base?" --> FBCaughtOut["Runner Out"]
    LDCaughtTag -- "Out at Next Base?" --> LDCaughtOut["Runner Out"]
    PFCaughtTag -- "Out at Next Base?" --> PFCaughtOut["Runner Out"]
    GBOutcome -- Out at First --> Out["Record Out"]
    GBOutcome -- Safe at First --> Single["Single"]
    BOutcome -- Out at First --> Out
    BOutcome -- Safe at First --> Single
    Error --> IdentifyError{"Identify Error Committer"}
    IdentifyError -- First Baseman --> Error1B["Error on 1st Baseman"]
    IdentifyError -- Second Baseman --> Error2B["Error on 2nd Baseman"]
    IdentifyError -- Shortstop --> ErrorSS["Error on Shortstop"]
    IdentifyError -- Third Baseman --> Error3B["Error on 3rd Baseman"]
    Error1B --> E1BConsequences["Handle Error Consequences"]
    Error2B --> E2BConsequences["Handle Error Consequences"]
    ErrorSS --> ESSConsequences["Handle Error Consequences"]
    Error3B --> E3BConsequences["Handle Error Consequences"]
    E1BConsequences -- "Runner Advances" --> UpdatePlay["Update Play"]
    E2BConsequences -- "Runner Advances" --> UpdatePlay
    ESSConsequences -- "Runner Advances" --> Update Play
    E3BConsequences -- "Runner Advances" --> Update Play
    Single --> BaseRunnerAdv["Base Runner Advances"]
    Walk --> NextBatter["Next Batter"]
    StrikeOut --> NextBatter
    Out --> CheckOuts{"Check Number of Outs"}
    CheckOuts -- 3 Outs --> ChangeSides["Change Sides"]
    ChangeSides -- New Inning --> NewInning
    NextBatter --> Pitch
    RecordFoul --> CheckFoulCount["Check Foul Count"]
    CheckFoulCount -- 2 Strikes --> StrikeCount
    CheckFoulCount -- <2 Strikes --> Pitch
    CheckOuts -- <3 Outs --> NextBatter
    BaseRunnerAdv --> AdvancedRunners[Handle Advanced Runners]
    AdvancedRunners --> NextBatter




#### Error Handling: 
Define how the interface will handle incorrect inputs or conflicts.

### Live Scoreboard Update:
- Real-Time Sync: Describe how scoreboard updates will be synchronized across devices in real-time.
- Customization: Explain the options available for customizing the scoreboard display (fonts, colors, layouts).

### Multi-Tenancy & RBAC Model:
- Users explicitly can have memberships to multiple tenants across different types (Teams, Clubs, Associations, Travel Leagues, Tournaments).
- Membership explicitly defines the user's role and permissions within each specific tenant.

### Statistical Data Management:
- Data Structures: Outline the structure of statistical data and how it is captured and updated.
- Reporting: Discuss how users will access and generate reports from historical data.

### External API Integration:
- API Partners: List potential scoring and statistics platforms for integration.
- Data Exchange Formats: Specify the formats and protocols for exchanging data with external APIs.

### iScore Integration (Read-only):
- Integrate explicitly with iScore REST API for fetching live game scoring data.
- Clearly reference the [iScore REST API documentation](https://www.postman.com/aviation-technologist-30718165/iscore-api/documentation/5as36pg/iscore).

### Multi-Platform Support:
- Responsive Design: Confirm that the initial web application is fully responsive and will function on various device sizes and platforms.
- Future Developments: Set the stage for future native app developments for iOS and Android platforms.

### Media Asset Management:
- Support explicit uploading, storage, and retrieval of media assets (logos for Teams, Clubs, Associations, Tournaments; profile images and audio snippets for Players).
- Clearly defined media file specifications:
  - **Images**: PNG/SVG logos (~500x500 px), Player profiles JPG/PNG (~400x400 px), with size limits (~300KB images, ~500KB audio).
  - **Audio snippets (player walk-out)**: Short audio clips (10-20 sec), MP3/AAC formats stored in Firebase Storage.

### Traditional Scorebook View:
- Provide a traditional scorebook-style UI clearly showing play-by-play events, allowing scorers and officials to verify scoring details quickly.

### Reporting & Data Export:
- Initially support CSV and Excel format exports for statistics clearly.
- Future requirement explicitly defined for PDF exports in traditional scorebook format.

### Privacy & Consent:
- The application explicitly requires user consent for handling personal data including images and audio clips.
- Clearly defined notification preferences with explicit opt-in/out controls for users.
- Initially adhere clearly to relevant privacy principles and data handling guidelines relevant to Australia, with global considerations in future updates.


### Performance:
- Clearly state real-time synchronization requirement: game data updates within ~1 second.
- Initial support explicitly for 10 concurrent games, with scaling through Firebase's infrastructure clearly avoiding significant code changes.

### Backup & Disaster Recovery:
- Clearly outlined initial use of Firebase automatic backups and Firestore regular exports.
- Basic documented recovery procedure explicitly for rapid restoration in case of data loss or corruption.

## Gameplay Features:

Input methods for different game events (e.g., hits, runs, errors).
Support for multiple games simultaneously.
Undo/redo actions for scoring inputs.
Automated conflict resolution for discrepancies in dual scoring.

# 4. Non-Functional Requirements
## Performance: App should handle simultaneous accesses smoothly (define specific metrics like response time).

## Usability: Mobile-first design, intuitive UI/UX suitable for fast-paced sports environments.

## Security: Robust authentication and authorization, data encryption in transit and at rest.

## Scalability: System should scale to support an increase in user load and data volume.

## Maintainability: Code should be well-documented, modular, and testable.

## Accessibility: Meet accessibility standards to accommodate all users.

# 5. Data Requirements
## Data Models:
Player, Team, Game, Event, Score, Statistic, etc.

##Data Sharing and Integration:
Mechanisms for secure data sharing between users.
Specifications for integrating external sports scoring APIs.


# 6. Interface Requirements
## User Interfaces:
Mock-ups of key screens (scoring input, live scoreboard).

## Hardware Interfaces:
Compatibility requirements for different devices (smartphones, tablets, PCs).

## Software Interfaces:
API specifications for external integrations.
Details on the backend services structure.

# 7. System Features
## Detailed Breakdown:
Each major feature should have a detailed description, including use cases, required inputs, expected behavior, and outputs.

# 8. Acceptance Criteria
## Test Cases:
Define specific actions, expected results, and acceptance conditions.

## User Testing:
Plan for beta testing with real users to gather feedback and make necessary adjustments.

# 9. Appendices
## Appendix A: Glossary of Terms

## Appendix B: Acronyms

## Appendix C: Reference Documents
