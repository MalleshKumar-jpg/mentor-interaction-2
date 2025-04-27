#ifndef BACKEND_H
#define BACKEND_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

// Constants
#define MAX_USERNAME_LENGTH 50
#define MAX_PASSWORD_LENGTH 50
#define MAX_NAME_LENGTH 100
#define MAX_EMAIL_LENGTH 100
#define MAX_PHONE_LENGTH 15
#define MAX_DEPARTMENT_LENGTH 50
#define MAX_DESCRIPTION_LENGTH 500
#define MAX_SUMMARY_LENGTH 1000
#define MAX_DATE_LENGTH 11  
#define MAX_DIGITAL_ID_LENGTH 10
#define MAX_REG_NUMBER_LENGTH 15
#define MAX_PARENT_CONTACT_LENGTH 100
#define HASH_TABLE_SIZE 1000
#define MAX_MENTORS 100

typedef enum {
    MENTEE,
    MENTOR
} UserRole;

struct MenteeBSTNode;
struct User;
struct Task;
struct Meeting_note;

typedef struct Task {
    char description[MAX_DESCRIPTION_LENGTH];
    char due_date[MAX_DATE_LENGTH];
    struct Task* next;
} Task;

typedef struct Meeting_note {
    char date[MAX_DATE_LENGTH];
    char summary[MAX_SUMMARY_LENGTH];
    struct Meeting_note* next;
} Meeting_note;

typedef struct MenteeBSTNode {
    struct User* mentee;
    int meeting_count;
    struct MenteeBSTNode* left;
    struct MenteeBSTNode* right;
} MenteeBSTNode;

typedef struct User {
    char username[MAX_USERNAME_LENGTH];
    char password[MAX_PASSWORD_LENGTH];
    char name[MAX_NAME_LENGTH];
    char email[MAX_EMAIL_LENGTH];
    char phone[MAX_PHONE_LENGTH];
    char department[MAX_DEPARTMENT_LENGTH];
    UserRole role;
    
    union {
        struct {
            int year;
            char digital_id[MAX_DIGITAL_ID_LENGTH];
            char registration_number[MAX_REG_NUMBER_LENGTH];
            char parent_contact[MAX_PARENT_CONTACT_LENGTH];
            struct Task* tasks;
            struct Meeting_note* meeting_notes;
            struct User* mentor;
        } mentee_data;
        
        struct {
            struct MenteeBSTNode* mentees_bst_root;
        } mentor_data;
    } data;
    
    struct User* next;  //for hash table collision
} User;

void initialize_system();
User* find_user(char* username);

User* api_login(char* username, char* password);
void api_logout();
User* api_register_mentor(char* username, char* password, char* name, char* email, char* phone, char* department);
User* api_register_mentee(char* username, char* password, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_contact, char* mentor_username);
bool api_update_mentee_info(char* username, char* name, char* email, char* phone, char* department, int year, char* digital_id, char* registration_number, char* parent_contact);
bool api_add_task(char* mentee_username, char* description, char* due_date);
bool api_delete_task(char* mentee_username, int task_index);
bool api_add_meeting_note(char* mentee_username, char* date, char* summary);
bool api_delete_meeting_note(char* mentee_username, int note_index);
User** api_get_mentors(int* count);
User** api_get_mentees(char* mentor_username, int* count);
Task** api_get_tasks(char* mentee_username, int* count);
Meeting_note** api_get_meeting_notes(char* mentee_username, int* count);

#endif /* BACKEND_H */