/**
 * server.c - Web server implementation for mentorship system
 * 
 * Provides HTTP server functionality for the mentorship system
 * Handles API requests from the frontend JavaScript
 */

 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
 #include <stdbool.h>
 #include <unistd.h>
 #include <sys/socket.h>
 #include <netinet/in.h>
 #include <arpa/inet.h>
 #include <signal.h>
 #include <ctype.h>
 #include "backend.h"
 
 #define PORT 8081
 #define BUFFER_SIZE 4096
 #define MAX_PAYLOAD_SIZE 8192
 
 // Global variables
 int server_fd;
 bool running = true;
  
  // Function prototypes
  void handle_request(int client_fd);
  void send_response(int client_fd, int status_code, const char* content_type, const char* body);
  void send_file(int client_fd, const char* filename, const char* content_type);
  void handle_api_request(int client_fd, char* method, char* path, char* payload);
  void url_decode(char* dst, const char* src);
  char* read_payload(int client_fd, int content_length);
  void parse_query_string(char* query, char* params[][2], int* param_count);
  void signal_handler(int sig);
  
  // Utility functions
  void url_decode(char* dst, const char* src) {
      char a, b;
      while (*src) {
          if (*src == '%' && *(src + 1) && *(src + 2)) {
              a = tolower(*(src + 1));
              b = tolower(*(src + 2));
              
              if (isxdigit(a) && isxdigit(b)) {
                  if (a >= 'a') a = a - 'a' + 10;
                  else a = a - '0';
                  
                  if (b >= 'a') b = b - 'a' + 10;
                  else b = b - '0';
                  
                  *dst++ = 16 * a + b;
                  src += 3;
              } else {
                  *dst++ = *src++;
              }
          } else if (*src == '+') {
              *dst++ = ' ';
              src++;
          } else {
              *dst++ = *src++;
          }
      }
      *dst = '\0';
  }
  
  char* read_payload(int client_fd, int content_length) {
      if (content_length <= 0 || content_length > MAX_PAYLOAD_SIZE) {
          return NULL;
      }
      
      char* payload = (char*)malloc(content_length + 1);
      if (!payload) {
          return NULL;
      }
      
      int bytes_read = 0;
      int remaining = content_length;
      
      while (remaining > 0) {
          int n = read(client_fd, payload + bytes_read, remaining);
          if (n <= 0) {
              free(payload);
              return NULL;
          }
          bytes_read += n;
          remaining -= n;
      }
      
      payload[content_length] = '\0';
      return payload;
  }
  
  void parse_query_string(char* query, char* params[][2], int* param_count) {
      *param_count = 0;
      
      if (!query || !*query) {
          return;
      }
      
      char* token = strtok(query, "&");
      while (token && *param_count < 20) {
          char* equal = strchr(token, '=');
          if (equal) {
              *equal = '\0';
              params[*param_count][0] = token;
              params[*param_count][1] = equal + 1;
              (*param_count)++;
          }
          token = strtok(NULL, "&");
      }
  }
  
  // HTTP response functions
  void send_response(int client_fd, int status_code, const char* content_type, const char* body) {
      char header[BUFFER_SIZE];
      const char* status_text = "OK";
      
      if (status_code == 400) status_text = "Bad Request";
      else if (status_code == 404) status_text = "Not Found";
      else if (status_code == 500) status_text = "Internal Server Error";
      
      int body_length = strlen(body);
      
      sprintf(header, 
          "HTTP/1.1 %d %s\r\n"
          "Content-Type: %s\r\n"
          "Content-Length: %d\r\n"
          "Access-Control-Allow-Origin: *\r\n"
          "Access-Control-Allow-Methods: GET, POST, PUT, DELETE\r\n"
          "Access-Control-Allow-Headers: Content-Type\r\n"
          "\r\n",
          status_code, status_text, content_type, body_length);
      
      write(client_fd, header, strlen(header));
      write(client_fd, body, body_length);
  }
  
  void send_file(int client_fd, const char* filename, const char* content_type) {
      FILE* file = fopen(filename, "rb");
      if (!file) {
          send_response(client_fd, 404, "text/plain", "File not found");
          return;
      }
      
      // Get file size
      fseek(file, 0, SEEK_END);
      long file_size = ftell(file);
      fseek(file, 0, SEEK_SET);
      
      // Read file content
      char* file_content = (char*)malloc(file_size + 1);
      if (!file_content) {
          fclose(file);
          send_response(client_fd, 500, "text/plain", "Server error");
          return;
      }
      
      fread(file_content, 1, file_size, file);
      file_content[file_size] = '\0';
      fclose(file);
      
      // Send response
      send_response(client_fd, 200, content_type, file_content);
      
      free(file_content);
  }
  
  // API handling
 void handle_api_request(int client_fd, char* method, char* path, char* payload) {
     char response[BUFFER_SIZE];
     
     // Parse path to get API endpoint
     char* endpoint = path + 5;  // Skip "/api/"
     
     // Correctly structured if-else chain for API endpoints
     if (strcmp(endpoint, "login") == 0 && strcmp(method, "POST") == 0) {
          // Parse login payload
          char username[MAX_USERNAME_LENGTH] = {0};
          char password[MAX_PASSWORD_LENGTH] = {0};
          
          char* username_str = strstr(payload, "username=");
          char* password_str = strstr(payload, "password=");
          
          if (username_str && password_str) {
              username_str += 9;  // Skip "username="
              char* end = strchr(username_str, '&');
              if (end) *end = '\0';
              url_decode(username, username_str);
              
              password_str += 9;  // Skip "password="
              end = strchr(password_str, '&');
              if (end) *end = '\0';
              url_decode(password, password_str);
              
              User* user = api_login(username, password);
              if (user) {
                  sprintf(response, "{\"success\": true, \"role\": \"%s\", \"username\": \"%s\", \"name\": \"%s\"}",
                         user->role == MENTOR ? "mentor" : "mentee", user->username, user->name);
              } else {
                  sprintf(response, "{\"success\": false, \"message\": \"Invalid username or password\"}");
              }
          } else {
              sprintf(response, "{\"success\": false, \"message\": \"Missing username or password\"}");
          }
          
          send_response(client_fd, 200, "application/json", response);
         }
         else if (strcmp(endpoint, "logout") == 0 && strcmp(method, "POST") == 0) {
          api_logout();
          sprintf(response, "{\"success\": true}");
          send_response(client_fd, 200, "application/json", response);
         }
         else if (strcmp(endpoint, "register_mentor") == 0 && strcmp(method, "POST") == 0) {
          // Parse mentor registration payload
          char username[MAX_USERNAME_LENGTH] = {0};
          char password[MAX_PASSWORD_LENGTH] = {0};
          char name[MAX_NAME_LENGTH] = {0};
          char email[MAX_EMAIL_LENGTH] = {0};
          char phone[MAX_PHONE_LENGTH] = {0};
          char department[MAX_DEPARTMENT_LENGTH] = {0};
          
          // Extract parameters
          char* params[20][2];
          int param_count;
          parse_query_string(payload, params, &param_count);
          
          for (int i = 0; i < param_count; i++) {
              char decoded[MAX_NAME_LENGTH];
              url_decode(decoded, params[i][1]);
              
              if (strcmp(params[i][0], "username") == 0) {
                  strncpy(username, decoded, MAX_USERNAME_LENGTH);
              } else if (strcmp(params[i][0], "password") == 0) {
                  strncpy(password, decoded, MAX_PASSWORD_LENGTH);
              } else if (strcmp(params[i][0], "name") == 0) {
                  strncpy(name, decoded, MAX_NAME_LENGTH);
              } else if (strcmp(params[i][0], "email") == 0) {
                  strncpy(email, decoded, MAX_EMAIL_LENGTH);
              } else if (strcmp(params[i][0], "phone") == 0) {
                  strncpy(phone, decoded, MAX_PHONE_LENGTH);
              } else if (strcmp(params[i][0], "department") == 0) {
                  strncpy(department, decoded, MAX_DEPARTMENT_LENGTH);
              }
          }
          
          User* mentor = api_register_mentor(username, password, name, email, phone, department);
          if (mentor) {
              sprintf(response, "{\"success\": true, \"username\": \"%s\"}", mentor->username);
          } else {
              sprintf(response, "{\"success\": false, \"message\": \"Registration failed\"}");
          }
          
          send_response(client_fd, 200, "application/json", response);
         }else if (strcmp(endpoint, "register_mentee") == 0 && strcmp(method, "POST") == 0) {
            // Parse mentee registration payload
            char username[MAX_USERNAME_LENGTH] = {0};
            char password[MAX_PASSWORD_LENGTH] = {0};
            char name[MAX_NAME_LENGTH] = {0};
            char email[MAX_EMAIL_LENGTH] = {0};
            char phone[MAX_PHONE_LENGTH] = {0};
            char department[MAX_DEPARTMENT_LENGTH] = {0};
            int year = 1;
            char digitalId[MAX_DIGITAL_ID_LENGTH] = {0};
            char registrationNumber[MAX_REG_NUMBER_LENGTH] = {0};
            char parentName[MAX_NAME_LENGTH] = {0};
            char parentEmail[MAX_EMAIL_LENGTH] = {0};
            char parentContact[MAX_PHONE_LENGTH] = {0};
            char mentorUsername[MAX_USERNAME_LENGTH] = {0};
            
            // Extract parameters
            char* params[20][2];
            int param_count;
            parse_query_string(payload, params, &param_count);
            
            for (int i = 0; i < param_count; i++) {
                char decoded[MAX_NAME_LENGTH];
                url_decode(decoded, params[i][1]);
                
                if (strcmp(params[i][0], "username") == 0) {
                    strncpy(username, decoded, MAX_USERNAME_LENGTH);
                } else if (strcmp(params[i][0], "password") == 0) {
                    strncpy(password, decoded, MAX_PASSWORD_LENGTH);
                } else if (strcmp(params[i][0], "name") == 0) {
                    strncpy(name, decoded, MAX_NAME_LENGTH);
                } else if (strcmp(params[i][0], "email") == 0) {
                    strncpy(email, decoded, MAX_EMAIL_LENGTH);
                } else if (strcmp(params[i][0], "phone") == 0) {
                    strncpy(phone, decoded, MAX_PHONE_LENGTH);
                } else if (strcmp(params[i][0], "department") == 0) {
                    strncpy(department, decoded, MAX_DEPARTMENT_LENGTH);
                } else if (strcmp(params[i][0], "year") == 0) {
                    year = atoi(decoded);
                } else if (strcmp(params[i][0], "digitalId") == 0) {
                    strncpy(digitalId, decoded, MAX_DIGITAL_ID_LENGTH);
                } else if (strcmp(params[i][0], "registrationNumber") == 0) {
                    strncpy(registrationNumber, decoded, MAX_REG_NUMBER_LENGTH);
                } else if (strcmp(params[i][0], "parentName") == 0) {
                    strncpy(parentName, decoded, MAX_NAME_LENGTH);
                } else if (strcmp(params[i][0], "parentEmail") == 0) {
                    strncpy(parentEmail, decoded, MAX_EMAIL_LENGTH);
                } else if (strcmp(params[i][0], "parentContact") == 0) {
                    strncpy(parentContact, decoded, MAX_PHONE_LENGTH);
                } else if (strcmp(params[i][0], "mentorUsername") == 0) {
                    strncpy(mentorUsername, decoded, MAX_USERNAME_LENGTH);
                }
            }
            
            // Print debug info
            printf("Registering mentee: %s with mentor: %s\n", username, mentorUsername);
            
            User* mentee = api_register_mentee(username, password, name, email, phone, department, 
                                             year, digitalId, registrationNumber, parentName, parentEmail, parentContact, mentorUsername);
            if (mentee) {
                sprintf(response, "{\"success\": true, \"username\": \"%s\"}", mentee->username);
            } else {
                sprintf(response, "{\"success\": false, \"message\": \"Registration failed. Make sure all fields are valid and the mentor exists.\"}");
            }
            
            send_response(client_fd, 200, "application/json", response);
        }else if (strcmp(endpoint, "mentors") == 0 && strcmp(method, "GET") == 0) {
             int count = 0;
             User** mentors = api_get_mentors(&count);
             
             if (mentors) {
                 // Start building the JSON response
                 sprintf(response, "{\"success\": true, \"mentors\": [");
                 
                 for (int i = 0; i < count; i++) {
                     // Add comma between items
                     if (i > 0) {
                         strcat(response, ",");
                     }
                     
                     // Add mentor
                     char mentor_json[BUFFER_SIZE];
                     sprintf(mentor_json, 
                             "{\"username\": \"%s\", \"name\": \"%s\"}", 
                             mentors[i]->username, mentors[i]->name);
                     
                     strcat(response, mentor_json);
                 }
                 
                 // Close the JSON
                 strcat(response, "]}");
             } else {
                 sprintf(response, "{\"success\": true, \"mentors\": []}");
             }
             
             send_response(client_fd, 200, "application/json", response);
         }else if (strncmp(endpoint, "mentees", 7) == 0 && strcmp(method, "GET") == 0) {
             // Parse query parameter for mentor username
             char mentor_username[MAX_USERNAME_LENGTH] = {0};
             char* query_start = strchr(path, '?');
             
             if (query_start) {
                 query_start++;  // Move past the '?'
                 char* param = strstr(query_start, "mentor=");
                 if (param) {
                     param += 7;  // Move past "mentor="
                     char* amp = strchr(param, '&');
                     if (amp) *amp = '\0';
                     
                     // URL-decode the username
                     url_decode(mentor_username, param);
                 }
             }
             
             if (strlen(mentor_username) > 0) {
                 int count = 0;
                 User** mentees = api_get_mentees(mentor_username, &count);
                 
                 if (mentees) {
                     // Start building the JSON response
                     sprintf(response, "{\"success\": true, \"mentees\": [");
                     
                     for (int i = 0; i < count; i++) {
                         // Add comma between items
                         if (i > 0) {
                             strcat(response, ",");
                         }
                         
                         // Count meeting notes
                         int meeting_count = 0;
                         Meeting_note* note = mentees[i]->data.mentee_data.meeting_notes;
                         while (note) {
                             meeting_count++;
                             note = note->next;
                         }
                         
                         // Add mentee
                         char mentee_json[BUFFER_SIZE];
                         sprintf(mentee_json, 
                                 "{\"username\": \"%s\", \"name\": \"%s\", \"email\": \"%s\", "
                                 "\"phone\": \"%s\", \"department\": \"%s\", \"year\": %d, "
                                 "\"meetingCount\": %d}", 
                                 mentees[i]->username, mentees[i]->name, mentees[i]->email,
                                 mentees[i]->phone, mentees[i]->department, mentees[i]->data.mentee_data.year,
                                 meeting_count);
                         
                         strcat(response, mentee_json);
                     }
                     
                     // Close the JSON
                     strcat(response, "]}");
                     free(mentees);
                 } else {
                     sprintf(response, "{\"success\": true, \"mentees\": []}");
                 }
             } else {
                 sprintf(response, "{\"success\": false, \"message\": \"Missing mentor parameter\"}");
             }
             
             send_response(client_fd, 200, "application/json", response);
         }
         else if (strncmp(endpoint, "tasks", 5) == 0 && strcmp(method, "GET") == 0) {
             // Parse query parameter for mentee username
             char mentee_username[MAX_USERNAME_LENGTH] = {0};
             char* query_start = strchr(path, '?');
             
             if (query_start) {
                 if (strncmp(query_start + 1, "mentee=", 7) == 0) {
                     strncpy(mentee_username, query_start + 8, MAX_USERNAME_LENGTH - 1);
                     // If there are additional parameters, cut them off
                     char* amp = strchr(mentee_username, '&');
                     if (amp) *amp = '\0';
                 }
             }
             
             if (strlen(mentee_username) > 0) {
                 int count = 0;
                 Task** tasks = api_get_tasks(mentee_username, &count);
                 
                 if (tasks) {
                     // Start building the JSON response
                     sprintf(response, "{\"success\": true, \"tasks\": [");
                     
                     for (int i = 0; i < count; i++) {
                         // Add comma between items
                         if (i > 0) {
                             strcat(response, ",");
                         }
                         
                         // Add task
                         char task_json[BUFFER_SIZE];
                         sprintf(task_json, 
                                 "{\"description\": \"%s\", \"dueDate\": \"%s\"}", 
                                 tasks[i]->description, tasks[i]->due_date);
                         
                         strcat(response, task_json);
                     }
                     
                     // Close the JSON
                     strcat(response, "]}");
                     free(tasks);
                 } else {
                     sprintf(response, "{\"success\": true, \"tasks\": []}");
                 }
             } else {
                 sprintf(response, "{\"success\": false, \"message\": \"Missing mentee parameter\"}");
             }
             
             send_response(client_fd, 200, "application/json", response);
         }
         // FIX: This needs to be a separate else-if block, not nested inside the tasks endpoint
         else if (strncmp(endpoint, "profile", 7) == 0 && strcmp(method, "GET") == 0) {
             // Parse query parameter for username
             char username[MAX_USERNAME_LENGTH] = {0};
             char* query_start = strchr(path, '?');
             
             if (query_start) {
                 if (strncmp(query_start + 1, "username=", 9) == 0) {
                     strncpy(username, query_start + 10, MAX_USERNAME_LENGTH - 1);
                     // If there are additional parameters, cut them off
                     char* amp = strchr(username, '&');
                     if (amp) *amp = '\0';
                 }
             }
             
             if (strlen(username) > 0) {
                 User* user = find_user(username);
                 
                 if (user && user->role == MENTEE) {
                     // Get mentor name
                     char mentor_name[MAX_NAME_LENGTH] = "None";
                     if (user->data.mentee_data.mentor) {
                         strncpy(mentor_name, user->data.mentee_data.mentor->name, MAX_NAME_LENGTH);
                     }
                     
                     // Build the JSON response
                     sprintf(response, 
                        "{\"success\": true, \"profile\": {"
                        "\"name\": \"%s\", "
                        "\"email\": \"%s\", "
                        "\"phone\": \"%s\", "
                        "\"department\": \"%s\", "
                        "\"year\": %d, "
                        "\"digitalId\": \"%s\", "
                        "\"registrationNumber\": \"%s\", "
                        "\"parentName\": \"%s\", "
                        "\"parentEmail\": \"%s\", "
                        "\"parentContact\": \"%s\", "
                        "\"mentorName\": \"%s\""
                        "}}",
                        user->name,
                        user->email,
                        user->phone,
                        user->department,
                        user->data.mentee_data.year,
                        user->data.mentee_data.digital_id,
                        user->data.mentee_data.registration_number,
                        user->data.mentee_data.parent_name,
                        user->data.mentee_data.parent_email,
                        user->data.mentee_data.parent_contact,
                        mentor_name);
                 } else if (user && user->role == MENTOR) {
                     // Build the JSON response for mentor
                     sprintf(response, 
                             "{\"success\": true, \"profile\": {"
                             "\"name\": \"%s\", "
                             "\"email\": \"%s\", "
                             "\"phone\": \"%s\", "
                             "\"department\": \"%s\""
                             "}}",
                             user->name,
                             user->email,
                             user->phone,
                             user->department);
                 } else {
                     sprintf(response, "{\"success\": false, \"message\": \"User not found\"}");
                 }
             } else {
                 sprintf(response, "{\"success\": false, \"message\": \"Missing username parameter\"}");
             }
             
             send_response(client_fd, 200, "application/json", response);
         }else if (strcmp(endpoint, "update_profile") == 0 && strcmp(method, "POST") == 0) {
            // Parse payload
            char username[MAX_USERNAME_LENGTH] = {0};
            char name[MAX_NAME_LENGTH] = {0};
            char email[MAX_EMAIL_LENGTH] = {0};
            char phone[MAX_PHONE_LENGTH] = {0};
            char department[MAX_DEPARTMENT_LENGTH] = {0};
            int year = 1;
            char digitalId[MAX_DIGITAL_ID_LENGTH] = {0};
            char registrationNumber[MAX_REG_NUMBER_LENGTH] = {0};
            char parentName[MAX_NAME_LENGTH] = {0};
            char parentEmail[MAX_EMAIL_LENGTH] = {0};
            char parentContact[MAX_PHONE_LENGTH] = {0};
            
            // Extract parameters
            char* params[20][2];
            int param_count;
            parse_query_string(payload, params, &param_count);
            
            for (int i = 0; i < param_count; i++) {
                char decoded[MAX_NAME_LENGTH];
                url_decode(decoded, params[i][1]);
                
                if (strcmp(params[i][0], "username") == 0) {
                    strncpy(username, decoded, MAX_USERNAME_LENGTH);
                } else if (strcmp(params[i][0], "name") == 0) {
                    strncpy(name, decoded, MAX_NAME_LENGTH);
                } else if (strcmp(params[i][0], "email") == 0) {
                    strncpy(email, decoded, MAX_EMAIL_LENGTH);
                } else if (strcmp(params[i][0], "phone") == 0) {
                    strncpy(phone, decoded, MAX_PHONE_LENGTH);
                } else if (strcmp(params[i][0], "department") == 0) {
                    strncpy(department, decoded, MAX_DEPARTMENT_LENGTH);
                } else if (strcmp(params[i][0], "year") == 0) {
                    year = atoi(decoded);
                } else if (strcmp(params[i][0], "digitalId") == 0) {
                    strncpy(digitalId, decoded, MAX_DIGITAL_ID_LENGTH);
                } else if (strcmp(params[i][0], "registrationNumber") == 0) {
                    strncpy(registrationNumber, decoded, MAX_REG_NUMBER_LENGTH);
                } else if (strcmp(params[i][0], "parentName") == 0) {
                    strncpy(parentName, decoded, MAX_NAME_LENGTH);
                } else if (strcmp(params[i][0], "parentEmail") == 0) {
                    strncpy(parentEmail, decoded, MAX_EMAIL_LENGTH);
                } else if (strcmp(params[i][0], "parentContact") == 0) {
                    strncpy(parentContact, decoded, MAX_PHONE_LENGTH);
                }
            }
            
            // Update profile
            bool success = api_update_mentee_info(username, name, email, phone, department, 
                                                 year, digitalId, registrationNumber, parentName, parentEmail, parentContact);
            
            if (success) {
                sprintf(response, "{\"success\": true}");
            } else {
                sprintf(response, "{\"success\": false, \"message\": \"Failed to update profile\"}");
            }
            
            send_response(client_fd, 200, "application/json", response);
        }else if (strcmp(endpoint, "add_task") == 0 && strcmp(method, "POST") == 0) {
             // Add task endpoint implementation
             char mentee[MAX_USERNAME_LENGTH] = {0};
             char description[MAX_DESCRIPTION_LENGTH] = {0};
             char dueDate[MAX_DATE_LENGTH] = {0};
             
             // Extract parameters
             char* params[20][2];
             int param_count;
             parse_query_string(payload, params, &param_count);
             
             for (int i = 0; i < param_count; i++) {
                 char decoded[MAX_DESCRIPTION_LENGTH];
                 url_decode(decoded, params[i][1]);
                 
                 if (strcmp(params[i][0], "mentee") == 0) {
                     strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
                 } else if (strcmp(params[i][0], "description") == 0) {
                     strncpy(description, decoded, MAX_DESCRIPTION_LENGTH);
                 } else if (strcmp(params[i][0], "dueDate") == 0) {
                     strncpy(dueDate, decoded, MAX_DATE_LENGTH);
                 }
             }
             
             bool success = api_add_task(mentee, description, dueDate);
             
             if (success) {
                 sprintf(response, "{\"success\": true}");
             } else {
                 sprintf(response, "{\"success\": false, \"message\": \"Failed to add task\"}");
             }
             
             send_response(client_fd, 200, "application/json", response);
         }else if (strncmp(endpoint, "meetings", 8) == 0 && strcmp(method, "GET") == 0) {
     // Parse query parameter for mentee username
     char mentee_username[MAX_USERNAME_LENGTH] = {0};
     char* query_start = strchr(path, '?');
     
     if (query_start) {
         if (strncmp(query_start + 1, "mentee=", 7) == 0) {
             strncpy(mentee_username, query_start + 8, MAX_USERNAME_LENGTH - 1);
             // If there are additional parameters, cut them off
             char* amp = strchr(mentee_username, '&');
             if (amp) *amp = '\0';
         }
     }
     
     if (strlen(mentee_username) > 0) {
         int count = 0;
         Meeting_note** notes = api_get_meeting_notes(mentee_username, &count);
         
         if (notes) {
             // Start building the JSON response
             sprintf(response, "{\"success\": true, \"meetings\": [");
             
             for (int i = 0; i < count; i++) {
                 // Add comma between items
                 if (i > 0) {
                     strcat(response, ",");
                 }
                 
                 // Add meeting note
                 char note_json[BUFFER_SIZE];
                 sprintf(note_json, 
                         "{\"date\": \"%s\", \"summary\": \"%s\"}", 
                         notes[i]->date, notes[i]->summary);
                 
                 strcat(response, note_json);
             }
             
             // Close the JSON
             strcat(response, "]}");
             free(notes);
         } else {
             sprintf(response, "{\"success\": true, \"meetings\": []}");
         }
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Missing mentee parameter\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }else if (strncmp(endpoint, "mentee_details", 14) == 0 && strcmp(method, "GET") == 0) {
    // Parse query parameter for mentor username
    char mentor_username[MAX_USERNAME_LENGTH] = {0};
    char* query_start = strchr(path, '?');
    
    if (query_start) {
        query_start++;  // Move past the '?'
        char* param = strstr(query_start, "mentor=");
        if (param) {
            param += 7;  // Move past "mentor="
            char* amp = strchr(param, '&');
            if (amp) *amp = '\0';
            
            // URL-decode the username
            url_decode(mentor_username, param);
        }
    }
    
    if (strlen(mentor_username) > 0) {
        int count = 0;
        User** mentees = api_get_mentees(mentor_username, &count);
        
        if (mentees) {
            // Start building the JSON response
            sprintf(response, "{\"success\": true, \"mentees\": [");
            
            for (int i = 0; i < count; i++) {
                // Add comma between items
                if (i > 0) {
                    strcat(response, ",");
                }
                
                // Count meeting notes and tasks
                int meeting_count = 0;
                int task_count = 0;
                Meeting_note* note = mentees[i]->data.mentee_data.meeting_notes;
                Task* task = mentees[i]->data.mentee_data.tasks;
                
                while (note) {
                    meeting_count++;
                    note = note->next;
                }
                
                while (task) {
                    task_count++;
                    task = task->next;
                }
                
                // Get mentor name
                char mentor_name[MAX_NAME_LENGTH] = "None";
                if (mentees[i]->data.mentee_data.mentor) {
                    strncpy(mentor_name, mentees[i]->data.mentee_data.mentor->name, MAX_NAME_LENGTH);
                }
                
                // Add mentee with full details
                char mentee_json[BUFFER_SIZE];
                sprintf(mentee_json, 
                        "{\"username\": \"%s\", \"name\": \"%s\", \"email\": \"%s\", "
                        "\"phone\": \"%s\", \"department\": \"%s\", \"year\": %d, "
                        "\"digitalId\": \"%s\", \"registrationNumber\": \"%s\", "
                        "\"parentContact\": \"%s\", \"mentorName\": \"%s\", "
                        "\"meetingCount\": %d, \"taskCount\": %d}", 
                        mentees[i]->username, mentees[i]->name, mentees[i]->email,
                        mentees[i]->phone, mentees[i]->department, mentees[i]->data.mentee_data.year,
                        mentees[i]->data.mentee_data.digital_id, 
                        mentees[i]->data.mentee_data.registration_number,
                        mentees[i]->data.mentee_data.parent_contact,
                        mentor_name,
                        meeting_count, task_count);
                
                strcat(response, mentee_json);
            }
            
            // Close the JSON
            strcat(response, "]}");
            free(mentees);
        } else {
            sprintf(response, "{\"success\": true, \"mentees\": []}");
        }
    } else {
        sprintf(response, "{\"success\": false, \"message\": \"Missing mentor parameter\"}");
    }
    
    send_response(client_fd, 200, "application/json", response);
}
 
 // 2. Add Meeting endpoint
 else if (strcmp(endpoint, "add_meeting") == 0 && strcmp(method, "POST") == 0) {
     // Parse payload
     char mentee[MAX_USERNAME_LENGTH] = {0};
     char date[MAX_DATE_LENGTH] = {0};
     char summary[MAX_SUMMARY_LENGTH] = {0};
     
     // Extract parameters
     char* params[20][2];
     int param_count;
     parse_query_string(payload, params, &param_count);
     
     for (int i = 0; i < param_count; i++) {
         char decoded[MAX_SUMMARY_LENGTH];
         url_decode(decoded, params[i][1]);
         
         if (strcmp(params[i][0], "mentee") == 0) {
             strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
         } else if (strcmp(params[i][0], "date") == 0) {
             strncpy(date, decoded, MAX_DATE_LENGTH);
         } else if (strcmp(params[i][0], "summary") == 0) {
             strncpy(summary, decoded, MAX_SUMMARY_LENGTH);
         }
     }
     
     bool success = api_add_meeting_note(mentee, date, summary);
     
     if (success) {
         sprintf(response, "{\"success\": true}");
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Failed to add meeting note\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }
 
 // 3. Delete Task endpoint
 else if (strcmp(endpoint, "delete_task") == 0 && strcmp(method, "POST") == 0) {
     // Parse payload
     char mentee[MAX_USERNAME_LENGTH] = {0};
     int task_index = -1;
     
     // Extract parameters
     char* params[20][2];
     int param_count;
     parse_query_string(payload, params, &param_count);
     
     for (int i = 0; i < param_count; i++) {
         char decoded[MAX_NAME_LENGTH];
         url_decode(decoded, params[i][1]);
         
         if (strcmp(params[i][0], "mentee") == 0) {
             strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
         } else if (strcmp(params[i][0], "index") == 0) {
             task_index = atoi(decoded);
         }
     }
     
     if (strlen(mentee) > 0 && task_index >= 0) {
         bool success = api_delete_task(mentee, task_index);
         
         if (success) {
             sprintf(response, "{\"success\": true}");
         } else {
             sprintf(response, "{\"success\": false, \"message\": \"Failed to delete task\"}");
         }
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Invalid parameters\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }
 
 // 4. Delete Meeting endpoint
 else if (strcmp(endpoint, "delete_meeting") == 0 && strcmp(method, "POST") == 0) {
     // Parse payload
     char mentee[MAX_USERNAME_LENGTH] = {0};
     int note_index = -1;
     
     // Extract parameters
     char* params[20][2];
     int param_count;
     parse_query_string(payload, params, &param_count);
     
     for (int i = 0; i < param_count; i++) {
         char decoded[MAX_NAME_LENGTH];
         url_decode(decoded, params[i][1]);
         
         if (strcmp(params[i][0], "mentee") == 0) {
             strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
         } else if (strcmp(params[i][0], "index") == 0) {
             note_index = atoi(decoded);
         }
     }
     
     if (strlen(mentee) > 0 && note_index >= 0) {
         bool success = api_delete_meeting_note(mentee, note_index);
         
         if (success) {
             sprintf(response, "{\"success\": true}");
         } else {
             sprintf(response, "{\"success\": false, \"message\": \"Failed to delete meeting note\"}");
         }
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Invalid parameters\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }
 
 // 5. Edit Task endpoint 
 else if (strcmp(endpoint, "edit_task") == 0 && strcmp(method, "POST") == 0) {
     // Parse payload
     char mentee[MAX_USERNAME_LENGTH] = {0};
     char description[MAX_DESCRIPTION_LENGTH] = {0};
     char due_date[MAX_DATE_LENGTH] = {0};
     int task_index = -1;
     
     // Extract parameters
     char* params[20][2];
     int param_count;
     parse_query_string(payload, params, &param_count);
     
     for (int i = 0; i < param_count; i++) {
         char decoded[MAX_DESCRIPTION_LENGTH];
         url_decode(decoded, params[i][1]);
         
         if (strcmp(params[i][0], "mentee") == 0) {
             strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
         } else if (strcmp(params[i][0], "description") == 0) {
             strncpy(description, decoded, MAX_DESCRIPTION_LENGTH);
         } else if (strcmp(params[i][0], "dueDate") == 0) {
             strncpy(due_date, decoded, MAX_DATE_LENGTH);
         } else if (strcmp(params[i][0], "index") == 0) {
             task_index = atoi(decoded);
         }
     }
     
     if (strlen(mentee) > 0 && task_index >= 0) {
         // First delete the existing task
         bool delete_success = api_delete_task(mentee, task_index);
         
         // Then add a new task with the updated information
         bool add_success = api_add_task(mentee, description, due_date);
         
         if (delete_success && add_success) {
             sprintf(response, "{\"success\": true}");
         } else {
             sprintf(response, "{\"success\": false, \"message\": \"Failed to update task\"}");
         }
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Invalid parameters\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }
 
 // 6. Edit Meeting endpoint
 else if (strcmp(endpoint, "edit_meeting") == 0 && strcmp(method, "POST") == 0) {
     // Parse payload
     char mentee[MAX_USERNAME_LENGTH] = {0};
     char date[MAX_DATE_LENGTH] = {0};
     char summary[MAX_SUMMARY_LENGTH] = {0};
     int note_index = -1;
     
     // Extract parameters
     char* params[20][2];
     int param_count;
     parse_query_string(payload, params, &param_count);
     
     for (int i = 0; i < param_count; i++) {
         char decoded[MAX_SUMMARY_LENGTH];
         url_decode(decoded, params[i][1]);
         
         if (strcmp(params[i][0], "mentee") == 0) {
             strncpy(mentee, decoded, MAX_USERNAME_LENGTH);
         } else if (strcmp(params[i][0], "date") == 0) {
             strncpy(date, decoded, MAX_DATE_LENGTH);
         } else if (strcmp(params[i][0], "summary") == 0) {
             strncpy(summary, decoded, MAX_SUMMARY_LENGTH);
         } else if (strcmp(params[i][0], "index") == 0) {
             note_index = atoi(decoded);
         }
     }
     
     if (strlen(mentee) > 0 && note_index >= 0) {
         // First delete the existing note
         bool delete_success = api_delete_meeting_note(mentee, note_index);
         
         // Then add a new note with the updated information
         bool add_success = api_add_meeting_note(mentee, date, summary);
         
         if (delete_success && add_success) {
             sprintf(response, "{\"success\": true}");
         } else {
             sprintf(response, "{\"success\": false, \"message\": \"Failed to update meeting note\"}");
         }
     } else {
         sprintf(response, "{\"success\": false, \"message\": \"Invalid parameters\"}");
     }
     
     send_response(client_fd, 200, "application/json", response);
 }
         else {
             sprintf(response, "{\"success\": false, \"message\": \"Unknown API endpoint: %s\"}", endpoint);
             send_response(client_fd, 404, "application/json", response);
         }
     }
  
  // Request handling
  void handle_request(int client_fd) {
      char buffer[BUFFER_SIZE];
      ssize_t bytes_received = read(client_fd, buffer, BUFFER_SIZE - 1);
      
      if (bytes_received <= 0) {
          return;
      }
      
      buffer[bytes_received] = '\0';
      
      // Parse HTTP request
      char method[10], path[255], version[20];
      sscanf(buffer, "%s %s %s", method, path, version);
      
      // Check for payload
      char* payload = NULL;
      int content_length = 0;
      char* content_length_str = strstr(buffer, "Content-Length:");
      if (content_length_str) {
          sscanf(content_length_str, "Content-Length: %d", &content_length);
          
          // Find the end of headers
          char* body_start = strstr(buffer, "\r\n\r\n");
          if (body_start) {
              body_start += 4;  // Skip the empty line
              int body_in_buffer = buffer + bytes_received - body_start;
              
              if (body_in_buffer < content_length) {
                  // Need to read more data
                  payload = read_payload(client_fd, content_length);
              } else {
                  // The entire payload is already in the buffer
                  payload = strdup(body_start);
              }
          }
      }
      
      // Handle the request
      if (strncmp(path, "/api/", 5) == 0) {
          handle_api_request(client_fd, method, path, payload);
      } else if (strcmp(path, "/") == 0 || strcmp(path, "/index.html") == 0) {
          send_file(client_fd, "index.html", "text/html");
      } else if (strstr(path, ".html")) {
          send_file(client_fd, path + 1, "text/html");
      } else if (strstr(path, ".css")) {
          send_file(client_fd, path + 1, "text/css");
      } else if (strstr(path, ".js")) {
          send_file(client_fd, path + 1, "application/javascript");
      } else {
          // File not found
          send_response(client_fd, 404, "text/plain", "Not Found");
      }
      
      if (payload) {
          free(payload);
      }
  }
  
  // Signal handler
  void signal_handler(int sig) {
      if (sig == SIGINT) {
          running = false;
          close(server_fd);
          printf("\nServer shutting down...\n");
          exit(0);
      }
  }
  
  // Main function
  int main() {
      // Initialize the mentorship system
      initialize_system();
      
      // Set up signal handler
      signal(SIGINT, signal_handler);
      
      // Create socket
      server_fd = socket(AF_INET, SOCK_STREAM, 0);
      if (server_fd < 0) {
          perror("Socket creation failed");
          exit(EXIT_FAILURE);
      }
      
      // Set socket options
      int opt = 1;
      if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
          perror("Setsockopt failed");
          exit(EXIT_FAILURE);
      }
      
      // Bind socket
      struct sockaddr_in address;
      address.sin_family = AF_INET;
      address.sin_addr.s_addr = INADDR_ANY;
      address.sin_port = htons(PORT);
      
      if (bind(server_fd, (struct sockaddr*)&address, sizeof(address)) < 0) {
          perror("Bind failed");
          exit(EXIT_FAILURE);
      }
      
      // Listen for connections
      if (listen(server_fd, 10) < 0) {
          perror("Listen failed");
          exit(EXIT_FAILURE);
      }
      
      printf("Server listening on port %d...\n", PORT);
      
      // Accept connections
      while (running) {
          struct sockaddr_in client_address;
          socklen_t client_address_len = sizeof(client_address);
          
          int client_fd = accept(server_fd, (struct sockaddr*)&client_address, &client_address_len);
          if (client_fd < 0) {
              if (running) {
                  perror("Accept failed");
              }
              continue;
          }
          
          // Handle the client's request
          handle_request(client_fd);
          
          // Close the connection
          close(client_fd);
      }
      
      return 0;
  }