# USER STORIES AND USER ACCEPTANCE TESTS

## 1. User Stories

| Identifier | User Story                                                                                                 | Size |
|------------|------------------------------------------------------------------------------------------------------------|------|
| 1          | As a user, I can sign up using my email so that I can create an account on the system.                     | 5    |
| 2          | As a user, I can sign up using Google so that I can quickly create an account without entering details manually. | 5    |
| 3          | As a user, I can log in so that I can access my account.                                                  | 3    |
| 4          | As a user, I can reset my password so that I can regain access if I forget it.                            | 3    |

## 2. User Acceptance Tests

The following User Acceptance Tests correspond to the identifiers of the 4 User Stories listed above:

1. Given I am a new user, when I enter my email, password, and required details on the signup page, then I should be able to create an account and see a confirmation message.  
2. Given I am a new user, when I click the "Sign up with Google" button and authorize access, then my account should be created and I should be redirected to my dashboard.  
3. Given I am a registered user, when I enter valid login credentials, then I should be redirected to my dashboard.  
4. Given I am a user with an existing account, when I enter my registered email on the "Forgot Password" page, then I should receive a password reset email and be able to set a new password.  
