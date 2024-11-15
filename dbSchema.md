# Neon DB Schema

## Tables

### users
Stores information about each user.

- **id**           VARCHAR(50)       PRIMARY KEY                     Unique identifier for each user
- **name**         VARCHAR(100)  NOT NULL                        Name of the user
- **email**        VARCHAR(100)  UNIQUE, NOT NULL                Email address of the user
- **clerk_id**     VARCHAR(50)   UNIQUE, NOT NULL                Unique Clerk identifier
- **assistantId**  VARCHAR(100)  NOT NULL                        ID of the assistant assigned
- **createdAt**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of creation
- **updatedAt**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of last update

---

### notes
Stores notes created by each user.

- **id**           VARCHAR(50)       PRIMARY KEY                     Unique identifier for each note
- **content**      TEXT          NOT NULL                        Content of the note
- **userId**       INTEGER       NOT NULL, FOREIGN KEY           ID of the user who created the note
                                (userId) REFERENCES users(id)  
- **createdAt**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of creation
- **updatedAt**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of last update
