#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "backend.h"

void print_json_string(const char* str) {
    printf("\"");
    for (int i = 0; str[i] != '\0'; i++) {
        if (str[i] == '"') printf("\\\"");
        else if (str[i] == '\\') printf("\\\\");
        else if (str[i] == '\n') printf("\\n");
        else if (str[i] == '\r') printf("\\r");
        else if (str[i] == '\t') printf("\\t");
        else printf("%c", str[i]);
    }
    printf("\"");
}

int main(int argc, char* argv[]) {
    initialize_system();
    
    if (argc < 2) {
        printf("{\"success\":false,\"message\":\"No command provided\"}\n");
        return 1;
    }
    
    char* command = argv[1];
    
    if (strcmp(command, "login") == 0 && argc == 4) {
        User* user = api_login(argv[2], argv[3]);
        if (user) {
            printf("{\"success\":true,\"username\":");
            print_json_string(user->username);
            printf(",\"name\":");
            print_json_string(user->name);
            printf(",\"role\":\"%s\"}\n", user->role == MENTOR ? "mentor" : "mentee");
        } else {
            printf("{\"success\":false,\"message\":\"Invalid credentials\"}\n");
        }
    }
    else if (strcmp(command, "register_mentor") == 0 && argc == 8) {
        User* mentor = api_register_mentor(argv[2], argv[3], argv[4], argv[5], argv[6], argv[7]);
        if (mentor) {
            printf("{\"success\":true,\"username\":");
            print_json_string(mentor->username);
            printf("}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Registration failed\"}\n");
        }
    }
    else if (strcmp(command, "register_mentee") == 0 && argc == 15) {
        int year = atoi(argv[8]);
        User* mentee = api_register_mentee(argv[2], argv[3], argv[4], argv[5], argv[6], argv[7], year, argv[9], argv[10], argv[11], argv[12], argv[13], argv[14]);
        if (mentee) {
            printf("{\"success\":true,\"username\":");
            print_json_string(mentee->username);
            printf("}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Registration failed\"}\n");
        }
    }
    else if (strcmp(command, "get_mentors") == 0) {
        int count = 0;
        User** mentors = api_get_mentors(&count);
        
        printf("{\"success\":true,\"mentors\":[");
        for (int i = 0; i < count; i++) {
            if (i > 0) printf(",");
            printf("{\"username\":");
            print_json_string(mentors[i]->username);
            printf(",\"name\":");
            print_json_string(mentors[i]->name);
            printf("}");
        }
        printf("]}\n");
    }
    else if (strcmp(command, "get_profile") == 0 && argc == 3) {
        User* user = find_user(argv[2]);
        if (user) {
            printf("{\"success\":true,\"profile\":{");
            printf("\"name\":");
            print_json_string(user->name);
            printf(",\"email\":");
            print_json_string(user->email);
            printf(",\"phone\":");
            print_json_string(user->phone);
            printf(",\"department\":");
            print_json_string(user->department);
            
            if (user->role == MENTEE) {
                printf(",\"year\":%d", user->data.mentee_data.year);
                printf(",\"digitalId\":");
                print_json_string(user->data.mentee_data.digital_id);
                printf(",\"registrationNumber\":");
                print_json_string(user->data.mentee_data.registration_number);
                printf(",\"parentName\":");
                print_json_string(user->data.mentee_data.parent_name);
                printf(",\"parentEmail\":");
                print_json_string(user->data.mentee_data.parent_email);
                printf(",\"parentContact\":");
                print_json_string(user->data.mentee_data.parent_contact);
                
                if (user->data.mentee_data.mentor) {
                    printf(",\"mentorName\":");
                    print_json_string(user->data.mentee_data.mentor->name);
                } else {
                    printf(",\"mentorName\":\"None\"");
                }
            }
            printf("}}\n");
        } else {
            printf("{\"success\":false,\"message\":\"User not found\"}\n");
        }
    }
    else if (strcmp(command, "get_tasks") == 0 && argc == 3) {
        int count = 0;
        Task** tasks = api_get_tasks(argv[2], &count);
        
        printf("{\"success\":true,\"tasks\":[");
        if (tasks) {
            for (int i = 0; i < count; i++) {
                if (i > 0) printf(",");
                printf("{\"description\":");
                print_json_string(tasks[i]->description);
                printf(",\"dueDate\":");
                print_json_string(tasks[i]->due_date);
                printf("}");
            }
            free(tasks);
        }
        printf("]}\n");
    }
    else if (strcmp(command, "add_task") == 0 && argc == 5) {
        bool success = api_add_task(argv[2], argv[3], argv[4]);
        if (success) {
            printf("{\"success\":true}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Failed to add task\"}\n");
        }
    }
    else if (strcmp(command, "delete_task") == 0 && argc == 4) {
        int index = atoi(argv[3]);
        bool success = api_delete_task(argv[2], index);
        if (success) {
            printf("{\"success\":true}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Failed to delete task\"}\n");
        }
    }
    else if (strcmp(command, "get_meetings") == 0 && argc == 3) {
        int count = 0;
        Meeting_note** notes = api_get_meeting_notes(argv[2], &count);
        
        printf("{\"success\":true,\"meetings\":[");
        if (notes) {
            for (int i = 0; i < count; i++) {
                if (i > 0) printf(",");
                printf("{\"date\":");
                print_json_string(notes[i]->date);
                printf(",\"summary\":");
                print_json_string(notes[i]->summary);
                printf("}");
            }
            free(notes);
        }
        printf("]}\n");
    }
    else if (strcmp(command, "add_meeting") == 0 && argc == 5) {
        bool success = api_add_meeting_note(argv[2], argv[3], argv[4]);
        if (success) {
            printf("{\"success\":true}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Failed to add meeting note\"}\n");
        }
    }
    else if (strcmp(command, "delete_meeting") == 0 && argc == 4) {
        int index = atoi(argv[3]);
        bool success = api_delete_meeting_note(argv[2], index);
        if (success) {
            printf("{\"success\":true}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Failed to delete meeting note\"}\n");
        }
    }
    else if (strcmp(command, "update_profile") == 0 && argc == 13) {
        int year = atoi(argv[7]);
        bool success = api_update_mentee_info(argv[2], argv[3], argv[4], argv[5], argv[6], year, argv[8], argv[9], argv[10], argv[11], argv[12]);
        if (success) {
            printf("{\"success\":true}\n");
        } else {
            printf("{\"success\":false,\"message\":\"Failed to update profile\"}\n");
        }
    }
    else if (strcmp(command, "get_mentee_details") == 0 && argc == 3) {
        int count = 0;
        User** mentees = api_get_mentees(argv[2], &count);
        
        printf("{\"success\":true,\"mentees\":[");
        if (mentees) {
            for (int i = 0; i < count; i++) {
                if (i > 0) printf(",");
                
                // Count tasks and meetings
                int task_count = 0;
                int meeting_count = 0;
                Task* task = mentees[i]->data.mentee_data.tasks;
                Meeting_note* note = mentees[i]->data.mentee_data.meeting_notes;
                
                while (task) {
                    task_count++;
                    task = task->next;
                }
                while (note) {
                    meeting_count++;
                    note = note->next;
                }
                
                printf("{\"username\":");
                print_json_string(mentees[i]->username);
                printf(",\"name\":");
                print_json_string(mentees[i]->name);
                printf(",\"email\":");
                print_json_string(mentees[i]->email);
                printf(",\"phone\":");
                print_json_string(mentees[i]->phone);
                printf(",\"department\":");
                print_json_string(mentees[i]->department);
                printf(",\"year\":%d", mentees[i]->data.mentee_data.year);
                printf(",\"digitalId\":");
                print_json_string(mentees[i]->data.mentee_data.digital_id);
                printf(",\"registrationNumber\":");
                print_json_string(mentees[i]->data.mentee_data.registration_number);
                printf(",\"parentName\":");
                print_json_string(mentees[i]->data.mentee_data.parent_name);
                printf(",\"parentEmail\":");
                print_json_string(mentees[i]->data.mentee_data.parent_email);
                printf(",\"parentContact\":");
                print_json_string(mentees[i]->data.mentee_data.parent_contact);
                printf(",\"taskCount\":%d", task_count);
                printf(",\"meetingCount\":%d", meeting_count);
                printf("}");
            }
            free(mentees);
        }
        printf("]}\n");
    }
    else {
        printf("{\"success\":false,\"message\":\"Unknown command or invalid arguments\"}\n");
    }
    
    return 0;
}