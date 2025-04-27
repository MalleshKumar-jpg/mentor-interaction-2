#include "backend.h"

// Global variables
User* hash_table[HASH_TABLE_SIZE] = {NULL};
User* current_user = NULL;
User* mentor_list[MAX_MENTORS] = {NULL};
int mentor_count = 0;

// Hash function
unsigned int hash(char* username) {
    unsigned int hash_value = 0;
    for (int i = 0; username[i] != '\0'; i++) {
        hash_value = hash_value * 31 + username[i];
    }
    return hash_value % HASH_TABLE_SIZE;
}

// BST functions
MenteeBSTNode* create_bst_node(User* mentee) {
    MenteeBSTNode* node = (MenteeBSTNode*)malloc(sizeof(MenteeBSTNode));

    if (node) { //this code block will run if node was created succesfully
        node->mentee = mentee;
        node->meeting_count = 0;
        node->left = NULL;
        node->right = NULL;
        
      //iterating through linked list of mentees notes to get count of meeting notes
        Meeting_note* note = mentee->data.mentee_data.meeting_notes;
        while (note) {
            node->meeting_count++;
            note = note->next;
        }
    }
    return node;
}

MenteeBSTNode* insert_bst_node(MenteeBSTNode* root, User* mentee) {
    if (root == NULL) {
       MenteeBSTNode* node = create_bst_node(mentee);
       return node;
    }
    
    // count number of meetings of mentee to order accordingly (we use number of meeting notes as the key)
    int count = 0;
    Meeting_note* note = mentee->data.mentee_data.meeting_notes;
    while (note) {
        count++;
        note = note->next;
    }
    
    // Sort by meeting count in descending order
    if (count > root->meeting_count) {
        root->left = insert_bst_node(root->left, mentee);
    } else {
        root->right = insert_bst_node(root->right, mentee);
    }
    
    return root;
}

MenteeBSTNode* find_mentee_in_bst(MenteeBSTNode* root, User* mentee) {
   if (root == NULL) {
       return NULL;
   }
   
   if (root->mentee == mentee) {
       return root;
   }
   else if (find_mentee_in_bst(root->left, mentee) != NULL) {
       return find_mentee_in_bst(root->left, mentee);
   }
   else {
       return find_mentee_in_bst(root->right, mentee);
   }
}

MenteeBSTNode* remove_bst_node(MenteeBSTNode* root, User* mentee) {
    if (root == NULL) {
        return NULL;
    }
    
    if (root->mentee == mentee) {
        //incase node has one child or no child
        if (root->left == NULL) {
            MenteeBSTNode* temp = root->right;
            free(root);
            return temp;
        } else if (root->right == NULL) {
            MenteeBSTNode* temp = root->left;
            free(root);
            return temp;
        }
        
        //incasethe node has two children

        //the following code is basically findmin()
        MenteeBSTNode* right_min = root->right;
        while (right_min->left != NULL) {
            right_min = right_min->left;
        }
        
        // copy the right_min data to root 
        root->mentee = right_min->mentee;
        root->meeting_count = right_min->meeting_count;
        
        //delete the right_min
        root->right = remove_bst_node(root->right, right_min->mentee);

    } else {
        root->left = remove_bst_node(root->left, mentee);
        root->right = remove_bst_node(root->right, mentee);
    }
    
    return root;
}

// User functions

//returns the user structure with given username
User* find_user(char* username) {
    unsigned int index = hash(username);
    User* user = hash_table[index];
    
   //we iterate through linked list , which is used for collision handling until user with matching username is found
    while (user != NULL) {
        if (strcmp(user->username, username) == 0) {
            return user; //returns user and exits if user is found
        }
       user = user->next; 
    }
    
    return NULL; //incase user does not exist
}

//adds the given user struct to hash table
bool add_user(User* user) {
    if (find_user(user->username) != NULL) {
        return false;  //username already exists
    }
    
    unsigned int index = hash(user->username);
    user->next = hash_table[index];
    hash_table[index] = user;
    
    if (user->role == MENTOR) {
        mentor_list[mentor_count++] = user;
    }
    
    return true;
}

//checks if login credentials are correct
bool login(char* username, char* password) {
    User* user = find_user(username);
    
    if (user != NULL && strcmp(user->password, password) == 0) {
        current_user = user; 
        return true;
    }
    
    return false;
}

void logout() {
    current_user = NULL;
}

// Task functions

Task* create_task(char* description, char* due_date) {
    Task* task = (Task*)malloc(sizeof(Task));
    if (task) {
        strncpy(task->description, description, MAX_DESCRIPTION_LENGTH);
        strncpy(task->due_date, due_date, MAX_DATE_LENGTH);
        task->next = NULL;
    }
    return task;
}

bool add_task(User* mentee, char* description, char* due_date) {
    
    Task* task = create_task(description, due_date);
    if (!task) {
        return false;
    }
    
    task->next = mentee->data.mentee_data.tasks; //task->next points to first task
    mentee->data.mentee_data.tasks = task; 
    
    return true;
}

bool delete_task(User* mentee, int task_index) { //task_index is input based on the task user has chosen to delete (tasks are displayed in the website in the same order as linked list)
   
  //deleting the first task , so we replace the first node itself so we need to change the pointer in the mentee user struct 
   if (task_index == 0) {
       Task* first_task = mentee->data.mentee_data.tasks;
       if (first_task == NULL) {
           return false;  // No tasks to delete
       }
       mentee->data.mentee_data.tasks = first_task->next;
       free(first_task);
       return true;
   }
   
   Task* current = mentee->data.mentee_data.tasks;
   Task* prev = NULL;
   int i = 0;
   
   while (current != NULL && i < task_index) {
       prev = current;
       current = current->next;
       i++;
   }
   
   if (current == NULL) {
      return false;  //task wasnt found
   }
   
   prev->next = current->next;
   free(current);
   return true;
}



// Meeting notes functions


Meeting_note* create_meeting_note(char* date, char* summary) {
    Meeting_note* note = (Meeting_note*)malloc(sizeof(Meeting_note));

    if (note) {
        strncpy(note->date, date, MAX_DATE_LENGTH);
        strncpy(note->summary, summary, MAX_SUMMARY_LENGTH);
        note->next = NULL;
    }
    return note;
}

bool add_meeting_note(User* mentee, char* date, char* summary) {
   
   Meeting_note* note = create_meeting_note(date, summary);
   if (!note) {
       return false;
   }
   
   note->next = mentee->data.mentee_data.meeting_notes;
   mentee->data.mentee_data.meeting_notes = note;
   
  //update mentor's BST since the key (meeting count) has changed , the structure of BST is compromised
   //we update by deleting that mentee from BST and adding again
   User* mentor = mentee->data.mentee_data.mentor;
  mentor->data.mentor_data.mentees_bst_root = remove_bst_node(mentor->data.mentor_data.mentees_bst_root, mentee);
  mentor->data.mentor_data.mentees_bst_root = insert_bst_node(mentor->data.mentor_data.mentees_bst_root, mentee);
   
   return true;
}

bool delete_meeting_note(User* mentee, int note_index) {
    
    Meeting_note* current = mentee->data.mentee_data.meeting_notes;
    Meeting_note* prev = NULL;
    int i = 0;
    
    while (current != NULL && i < note_index) {
        prev = current;
        current = current->next;
        i++;
    }
    
    if (current == NULL) {
        return false;  // Note not found
    }
    
    if (prev == NULL) {
        mentee->data.mentee_data.meeting_notes = current->next;
    } else {
        prev->next = current->next;
    }
    
    free(current);
    
  //same reason as above function
   User* mentor = mentee->data.mentee_data.mentor;
   mentor->data.mentor_data.mentees_bst_root = remove_bst_node( mentor->data.mentor_data.mentees_bst_root, mentee);
   mentor->data.mentor_data.mentees_bst_root = insert_bst_node(mentor->data.mentor_data.mentees_bst_root, mentee);
    
   return true;
}

// Registration functions
User* register_mentor(char* username, char* password, char* name, char* email, char* phone, char* department) {
    
    User* mentor = (User*)malloc(sizeof(User));
    if (!mentor) {
        return NULL;
    }
    
    strncpy(mentor->username, username, MAX_USERNAME_LENGTH);
    strncpy(mentor->password, password, MAX_PASSWORD_LENGTH);
    strncpy(mentor->name, name, MAX_NAME_LENGTH);
    strncpy(mentor->email, email, MAX_EMAIL_LENGTH);
    strncpy(mentor->phone, phone, MAX_PHONE_LENGTH);
    strncpy(mentor->department, department, MAX_DEPARTMENT_LENGTH);
    mentor->role = MENTOR;
    mentor->data.mentor_data.mentees_bst_root = NULL;
    mentor->next = NULL;
    
   if (add_user(mentor)) { 
        return mentor;
    }
    
    free(mentor);
    return NULL;
}

User* register_mentee(char* username, char* password, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_name, char* parent_email, char* parent_contact, User* mentor) {
    
    User* mentee = (User*)malloc(sizeof(User));
    if (!mentee) {
        return NULL;
    }
    
    strncpy(mentee->username, username, MAX_USERNAME_LENGTH);
    strncpy(mentee->password, password, MAX_PASSWORD_LENGTH);
    strncpy(mentee->name, name, MAX_NAME_LENGTH);
    strncpy(mentee->email, email, MAX_EMAIL_LENGTH);
    strncpy(mentee->phone, phone, MAX_PHONE_LENGTH);
    strncpy(mentee->department, department, MAX_DEPARTMENT_LENGTH);
    mentee->role = MENTEE;
    mentee->data.mentee_data.year = year;
    strncpy(mentee->data.mentee_data.digital_id, digital_id, MAX_DIGITAL_ID_LENGTH);
    strncpy(mentee->data.mentee_data.registration_number, registration_number, MAX_REG_NUMBER_LENGTH);
    strncpy(mentee->data.mentee_data.parent_name, parent_name, MAX_NAME_LENGTH);
    strncpy(mentee->data.mentee_data.parent_email, parent_email, MAX_EMAIL_LENGTH);
    strncpy(mentee->data.mentee_data.parent_contact, parent_contact, MAX_PHONE_LENGTH);
    mentee->data.mentee_data.tasks = NULL;
    mentee->data.mentee_data.meeting_notes = NULL;
    mentee->data.mentee_data.mentor = mentor;
    mentee->next = NULL;
    
    if (add_user(mentee)) {
        // Add mentee to mentor's BST
        mentor->data.mentor_data.mentees_bst_root = insert_bst_node(mentor->data.mentor_data.mentees_bst_root, mentee);
        return mentee;
    }
    
    free(mentee);
    return NULL;
}
bool update_mentee_info(User* mentee, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_name, char* parent_email, char* parent_contact) {
    
    strncpy(mentee->name, name, MAX_NAME_LENGTH);
    strncpy(mentee->email, email, MAX_EMAIL_LENGTH);
    strncpy(mentee->phone, phone, MAX_PHONE_LENGTH);
    strncpy(mentee->department, department, MAX_DEPARTMENT_LENGTH);
    mentee->data.mentee_data.year = year;
    strncpy(mentee->data.mentee_data.digital_id, digital_id, MAX_DIGITAL_ID_LENGTH);
    strncpy(mentee->data.mentee_data.registration_number, registration_number, MAX_REG_NUMBER_LENGTH);
    strncpy(mentee->data.mentee_data.parent_name, parent_name, MAX_NAME_LENGTH);
    strncpy(mentee->data.mentee_data.parent_email, parent_email, MAX_EMAIL_LENGTH);
    strncpy(mentee->data.mentee_data.parent_contact, parent_contact, MAX_PHONE_LENGTH);
    
    return true;
}

//File handling functions

void save_users_to_file() {
    FILE* file = fopen("users.dat", "wb");
    if (!file) {
        return;
    }
    
    // Write hash table
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        User* user = hash_table[i];
        while (user) {
            // Write the user
            fwrite(&user->role, sizeof(UserRole), 1, file);
            fwrite(user->username, sizeof(char), MAX_USERNAME_LENGTH, file);
            fwrite(user->password, sizeof(char), MAX_PASSWORD_LENGTH, file);
            fwrite(user->name, sizeof(char), MAX_NAME_LENGTH, file);
            fwrite(user->email, sizeof(char), MAX_EMAIL_LENGTH, file);
            fwrite(user->phone, sizeof(char), MAX_PHONE_LENGTH, file);
            fwrite(user->department, sizeof(char), MAX_DEPARTMENT_LENGTH, file);
            
            if (user->role == MENTEE) {
                fwrite(&user->data.mentee_data.year, sizeof(int), 1, file);
                fwrite(user->data.mentee_data.digital_id, sizeof(char), MAX_DIGITAL_ID_LENGTH, file);
                fwrite(user->data.mentee_data.registration_number, sizeof(char), MAX_REG_NUMBER_LENGTH, file);
                fwrite(user->data.mentee_data.parent_contact, sizeof(char), MAX_PHONE_LENGTH, file);
                fwrite(user->data.mentee_data.parent_name, sizeof(char), MAX_NAME_LENGTH, file);
                fwrite(user->data.mentee_data.parent_email, sizeof(char), MAX_EMAIL_LENGTH, file);

                // Save mentor username
                char mentor_username[MAX_USERNAME_LENGTH] = {0};
                if (user->data.mentee_data.mentor) {
                    strncpy(mentor_username, user->data.mentee_data.mentor->username, MAX_USERNAME_LENGTH);
                }
                fwrite(mentor_username, sizeof(char), MAX_USERNAME_LENGTH, file);
                
                // Save tasks
                int task_count = 0;
                Task* task = user->data.mentee_data.tasks;
                while (task) {
                    task_count++;
                    task = task->next;
                }
                fwrite(&task_count, sizeof(int), 1, file);
                
                task = user->data.mentee_data.tasks;
                while (task) {
                    fwrite(task->description, sizeof(char), MAX_DESCRIPTION_LENGTH, file);
                    fwrite(task->due_date, sizeof(char), MAX_DATE_LENGTH, file);
                    task = task->next;
                }
                
                // Save meeting notes
                int note_count = 0;
                Meeting_note* note = user->data.mentee_data.meeting_notes;
                while (note) {
                    note_count++;
                    note = note->next;
                }
                fwrite(&note_count, sizeof(int), 1, file);
                
                note = user->data.mentee_data.meeting_notes;
                while (note) {
                    fwrite(note->date, sizeof(char), MAX_DATE_LENGTH, file);
                    fwrite(note->summary, sizeof(char), MAX_SUMMARY_LENGTH, file);
                    note = note->next;
                }
            }
            
            user = user->next;
        }
    }
    
    fclose(file);
}

void load_users_from_file() {
    FILE* file = fopen("users.dat", "rb");
    if (!file) {
        return;
    }
    
    // Clear existing data
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        User* user = hash_table[i];
        while (user) {
            User* temp = user;
            user = user->next;
            free(temp);
        }
        hash_table[i] = NULL;
    }
    
    memset(mentor_list, 0, sizeof(mentor_list));
    mentor_count = 0;
    
    // Create a temporary array to store mentor usernames for each mentee
    char mentor_usernames[HASH_TABLE_SIZE][MAX_USERNAME_LENGTH];
    int mentee_count = 0;
    
    // Read users
    while (!feof(file)) {
        User* user = (User*)malloc(sizeof(User));
        if (!user) {
            break;
        }
        
        // Read basic user info
        if (fread(&user->role, sizeof(UserRole), 1, file) != 1) {
            free(user);
            break;
        }
        
        fread(user->username, sizeof(char), MAX_USERNAME_LENGTH, file);
        fread(user->password, sizeof(char), MAX_PASSWORD_LENGTH, file);
        fread(user->name, sizeof(char), MAX_NAME_LENGTH, file);
        fread(user->email, sizeof(char), MAX_EMAIL_LENGTH, file);
        fread(user->phone, sizeof(char), MAX_PHONE_LENGTH, file);
        fread(user->department, sizeof(char), MAX_DEPARTMENT_LENGTH, file);
        
        user->next = NULL;
        
        if (user->role == MENTEE) {
            fread(&user->data.mentee_data.year, sizeof(int), 1, file);
            fread(user->data.mentee_data.digital_id, sizeof(char), MAX_DIGITAL_ID_LENGTH, file);
            fread(user->data.mentee_data.registration_number, sizeof(char), MAX_REG_NUMBER_LENGTH, file);
            fread(user->data.mentee_data.parent_contact, sizeof(char), MAX_PHONE_LENGTH, file);
            fread(user->data.mentee_data.parent_name, sizeof(char), MAX_NAME_LENGTH, file);
            fread(user->data.mentee_data.parent_email, sizeof(char), MAX_EMAIL_LENGTH, file);

            // Read mentor username
            char mentor_username[MAX_USERNAME_LENGTH];
            fread(mentor_username, sizeof(char), MAX_USERNAME_LENGTH, file);
            
            // Store mentor username for later processing
            if (mentee_count < HASH_TABLE_SIZE) {
                strncpy(mentor_usernames[mentee_count], mentor_username, MAX_USERNAME_LENGTH);
                mentee_count++;
            }
            
            user->data.mentee_data.mentor = NULL;  // Will be set later
            user->data.mentee_data.tasks = NULL;
            user->data.mentee_data.meeting_notes = NULL;
            
            // Read tasks
            int task_count;
            fread(&task_count, sizeof(int), 1, file);
            
            for (int i = 0; i < task_count; i++) {
                Task* task = (Task*)malloc(sizeof(Task));
                if (!task) {
                    break;
                }
                
                fread(task->description, sizeof(char), MAX_DESCRIPTION_LENGTH, file);
                fread(task->due_date, sizeof(char), MAX_DATE_LENGTH, file);
                task->next = NULL;
                
                // Add task to mentee's task list
                task->next = user->data.mentee_data.tasks;
                user->data.mentee_data.tasks = task;
            }
            
            // Read meeting notes
            int note_count;
            fread(&note_count, sizeof(int), 1, file);
            
            for (int i = 0; i < note_count; i++) {
                Meeting_note* note = (Meeting_note*)malloc(sizeof(Meeting_note));
                if (!note) {
                    break;
                }
                
                fread(note->date, sizeof(char), MAX_DATE_LENGTH, file);
                fread(note->summary, sizeof(char), MAX_SUMMARY_LENGTH, file);
                note->next = NULL;
                
                // Add note to mentee's note list
                note->next = user->data.mentee_data.meeting_notes;
                user->data.mentee_data.meeting_notes = note;
            }
        } else if (user->role == MENTOR) {
            user->data.mentor_data.mentees_bst_root = NULL;
            
            // Add to mentor list
            if (mentor_count < MAX_MENTORS) {
                mentor_list[mentor_count++] = user;
            }
        }
        
        // Add to hash table
        unsigned int index = hash(user->username);
        user->next = hash_table[index];
        hash_table[index] = user;
    }
    
    fclose(file);
    
    // Set mentor pointers for mentees
    int mentee_index = 0;
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        User* user = hash_table[i];
        while (user) {
            if (user->role == MENTEE && mentee_index < mentee_count) {
                if (strlen(mentor_usernames[mentee_index]) > 0) {
                    user->data.mentee_data.mentor = find_user(mentor_usernames[mentee_index]);
                    
                    // Add mentee to mentor's BST
                    if (user->data.mentee_data.mentor) {
                        user->data.mentee_data.mentor->data.mentor_data.mentees_bst_root = 
                            insert_bst_node(user->data.mentee_data.mentor->data.mentor_data.mentees_bst_root, user);
                    }
                }
                mentee_index++;
            }
            user = user->next;
        }
    }
}

// Helper functions for traversing the BST
void get_mentees_in_order(MenteeBSTNode* root, User** mentees, int* index) {
    if (root == NULL) {
        return;
    }
    
    get_mentees_in_order(root->left, mentees, index);
    mentees[(*index)++] = root->mentee;
    get_mentees_in_order(root->right, mentees, index);
}

int count_mentees(MenteeBSTNode* root) {
    if (root == NULL) {
        return 0;
    }
    return 1 + count_mentees(root->left) + count_mentees(root->right);
}

User** get_sorted_mentees(User* mentor, int* count) {
    if (mentor->role != MENTOR) {
        *count = 0;
        return NULL;
    }
    
    *count = count_mentees(mentor->data.mentor_data.mentees_bst_root);
    User** mentees = (User**)malloc(sizeof(User*) * (*count));
    if (!mentees) {
        *count = 0;
        return NULL;
    }
    
    int index = 0;
    get_mentees_in_order(mentor->data.mentor_data.mentees_bst_root, mentees, &index);
    
    return mentees;
}

void generate_sample_data() {
    // Create sample mentors
    User* mentor1 = register_mentor("rajan.kumar", "Mentor@2025", "Dr. Rajan Kumar", "rajan.kumar@ssn.edu.in", "9845671230", "CSE");
    User* mentor2 = register_mentor("priya.sharma", "Faculty@2025", "Dr. Priya Sharma", "priya.sharma@ssn.edu.in", "7812345690", "ECE");
    
    User* mentee1 = register_mentee("aditya.singh", "Student@2025", "Aditya Singh", "aditya.singh@ssn.edu.in", "9876543210", "CSE", 2, "2041012", "3122245001025", "Rajesh Singh", "rajesh.singh@gmail.com", "9812345670", mentor1);
    User* mentee2 = register_mentee("kavya.patel", "Kavya@2025", "Kavya Patel", "kavya.patel@ssn.edu.in", "8765432109", "IT", 3, "2410391", "3122245001025", "Mahesh Patel", "mahesh.patel@gmail.com", "9756431280", mentor1);
    User* mentee3 = register_mentee("vishnu.nair", "Vishnu@2025", "Vishnu Nair", "vishnu.nair@ssn.edu.in", "7654321098", "ECE", 1, "2024115", "3122245001025", "Suresh Nair", "suresh.nair@gmail.com", "9567842310", mentor2);
    
    add_task(mentee1, "Read 'Atomic Habits' by James Clear", "15-05-2025");
    add_task(mentee1, "Practice meditation for 10 minutes daily", "20-05-2025");
    add_task(mentee2, "Practice public speaking in front of a mirror for 15 minutes daily", "10-05-2025");
    add_task(mentee3, "Join at least one technical club on campus", "12-05-2025");
    
    add_meeting_note(mentee1, "01-04-2025", "Discussed personal growth goals. Aditya wants to improve time management and reading habits. Recommended starting with 'Atomic Habits' and using the Pomodoro technique for study sessions.");
    add_meeting_note(mentee1, "15-04-2025", "Follow-up on personal development. Aditya has started meditation and reports better focus. Still struggling with consistent reading habit.");
    add_meeting_note(mentee2, "02-04-2025", "First meeting with Kavya. She expressed anxiety about presentations. Suggested daily practice in front of mirror and joining the college debate club to build confidence.");
    add_meeting_note(mentee3, "05-04-2025", "As a first-year student, Vishnu is feeling overwhelmed. Suggested joining a technical club to make friends with similar interests and build support network.");
    
    save_users_to_file();
}

void initialize_system() {
   load_users_from_file();
   
   bool has_users = false;
   for (int i = 0; i < HASH_TABLE_SIZE; i++) {
       if (hash_table[i] != NULL) {
           has_users = true;
           break;
       }
   }
   
   if (!has_users) {
       generate_sample_data();
   }
}

// API functions for server.c to use
User* api_login(char* username, char* password) {
   if (login(username, password)) {
       return current_user;
   }
   return NULL;
}

void api_logout() {
   logout();
}

User* api_register_mentor(char* username, char* password, char* name, char* email, char* phone, char* department) {
   User* mentor = register_mentor(username, password, name, email, phone, department);
   if (mentor) {
       save_users_to_file();
   }
   return mentor;
}

User* api_register_mentee(char* username, char* password, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_name, char* parent_email, char* parent_contact, char* mentor_username) {
    User* mentor = find_user(mentor_username);
    if (!mentor || mentor->role != MENTOR) {
        return NULL;
    }
    
    User* mentee = register_mentee(username, password, name, email, phone, department, year, 
                                 digital_id, registration_number, parent_name, parent_email, parent_contact, mentor);
    if (mentee) {
        save_users_to_file();
    }
    return mentee;
 }

 bool api_update_mentee_info(char* username, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_name, char* parent_email, char* parent_contact) {
    User* mentee = find_user(username);
    if (!mentee || mentee->role != MENTEE) {
        return false;
    }
    
    bool success = update_mentee_info(mentee, name, email, phone, department, year, digital_id, registration_number, parent_name, parent_email, parent_contact);
    if (success) {
        save_users_to_file();
    }
    return success;
 }

bool api_add_task(char* mentee_username, char* description, char* due_date) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       return false;
   }
   
   bool success = add_task(mentee, description, due_date);
   if (success) {
       save_users_to_file();
   }
   return success;
}

bool api_delete_task(char* mentee_username, int task_index) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       return false;
   }
   
   bool success = delete_task(mentee, task_index);
   if (success) {
       save_users_to_file();
   }
   return success;
}

bool api_add_meeting_note(char* mentee_username, char* date, char* summary) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       return false;
   }
   
   bool success = add_meeting_note(mentee, date, summary);
   if (success) {
       save_users_to_file();
   }
   return success;
}

bool api_delete_meeting_note(char* mentee_username, int note_index) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       return false;
   }
   
   bool success = delete_meeting_note(mentee, note_index);
   if (success) {
       save_users_to_file();
   }
   return success;
}

User** api_get_mentors(int* count) {
   *count = mentor_count;
   return mentor_list;
}

User** api_get_mentees(char* mentor_username, int* count) {
   User* mentor = find_user(mentor_username);
   if (!mentor || mentor->role != MENTOR) {
       *count = 0;
       return NULL;
   }
   
   return get_sorted_mentees(mentor, count);
}

Task** api_get_tasks(char* mentee_username, int* count) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       *count = 0;
       return NULL;
   }
   
   *count = 0;
   Task* task = mentee->data.mentee_data.tasks;
   while (task) {
       (*count)++;
       task = task->next;
   }
   
   Task** tasks = (Task**)malloc(sizeof(Task*) * (*count));
   if (!tasks) {
       *count = 0;
       return NULL;
   }
   
   task = mentee->data.mentee_data.tasks;
   for (int i = 0; i < *count; i++) {
       tasks[i] = task;
       task = task->next;
   }
   
   return tasks;
}

Meeting_note** api_get_meeting_notes(char* mentee_username, int* count) {
   User* mentee = find_user(mentee_username);
   if (!mentee || mentee->role != MENTEE) {
       *count = 0;
       return NULL;
   }
   
   *count = 0;
   Meeting_note* note = mentee->data.mentee_data.meeting_notes;
   while (note) {
       (*count)++;
       note = note->next;
   }
   
   Meeting_note** notes = (Meeting_note**)malloc(sizeof(Meeting_note*) * (*count));
   if (!notes) {
       *count = 0;
       return NULL;
   }
   
   note = mentee->data.mentee_data.meeting_notes;
   for (int i = 0; i < *count; i++) {
       notes[i] = note;
       note = note->next;
   }
   
   return notes;
   }