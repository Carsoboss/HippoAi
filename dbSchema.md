# Neon DB Schema

## Tables

### users
Stores information about each user.

- **id**           VARCHAR(50)       PRIMARY KEY                     Unique identifier for each user
- **name**         VARCHAR(100)  NOT NULL                        Name of the user
- **email**        VARCHAR(100)  UNIQUE, NOT NULL                Email address of the user
- **clerk_id**     VARCHAR(50)   UNIQUE, NOT NULL                Unique Clerk identifier
- **assistant_id**  VARCHAR(100)  NOT NULL                        ID of the assistant assigned
- **created_at**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of creation
- **updated_at**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of last update
- **vector_store_id** VARCHAR(100)  NOT NULL

---

### notes
Stores notes created by each user.

- **id**           VARCHAR(50)       PRIMARY KEY                     Unique identifier for each note
- **content**      TEXT          NOT NULL                        Content of the note
- **user_id**       INTEGER       NOT NULL, FOREIGN KEY           ID of the user who created the note
                                (userId) REFERENCES users(id)  
- **created_at**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of creation
- **updated_at**    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP       Date and time of last update
