#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

#define MAX_BOOKS 1000
#define MAX_BORROWS 5000

// ---------------- STRUCT ----------------
typedef struct {
  char id[50];
  char name[100];
  char author[100];
  char genre[100];
  char isbn[50];
  char cover[256];
  char publisher[100];
  char edition[50];
  char publication_year[20];
  char language[50];
  char status[50];
} Book;

typedef struct {
  char borrow_id[50];
  char book_id[50];
  char book_title[100];
  char student_name[100];
  char student_id[50];
  char borrow_date[50];
  char due_date[50];
  char return_date[50];
  char days_late[20];
  char fine[20];
  char status[50];
} Borrow;

// ---------------- NEW STRUCTS ----------------
typedef struct {
  char student_id[50];
  char name[100];
  char password[100];
  char email[100];
  char department[100];
  char year[50];
} Student;

typedef struct {
  char username[100];
  char password[100];
} Admin;

// ---------------- SAFE JSON EXTRACTION ----------------
char *get_json_val(const char *json, const char *key, char *out,
                   size_t max_len) {
  char search[100];
  snprintf(search, sizeof(search), "\"%s\"", key);

  char *ptr = strstr(json, search);
  if (!ptr) {
    out[0] = '\0';
    return NULL;
  }

  ptr = strchr(ptr, ':');
  if (!ptr) {
    out[0] = '\0';
    return NULL;
  }

  char *start = strchr(ptr, '"');
  if (!start) {
    out[0] = '\0';
    return NULL;
  }
  start++;

  char *end = strchr(start, '"');
  if (!end) {
    out[0] = '\0';
    return NULL;
  }

  size_t len = end - start;
  if (len >= max_len)
    len = max_len - 1;

  strncpy(out, start, len);
  out[len] = '\0';

  while (len > 0 && out[len - 1] == '\r') {
    out[--len] = '\0';
  }

  return out;
}

// ---------------- READ FILE ----------------
void ensure_json_file(const char *filename) {
    FILE *f = fopen(filename, "r");
    if (!f) {
        f = fopen(filename, "w");
        if (f) {
            fprintf(f, "[]\n");
            fclose(f);
        }
    } else {
        fseek(f, 0, SEEK_END);
        long size = ftell(f);
        fclose(f);
        if (size <= 0) {
            f = fopen(filename, "w");
            if (f) {
                fprintf(f, "[]\n");
                fclose(f);
            }
        }
    }
}
Book *read_books(int *count) {
  ensure_json_file("books.json");
  FILE *f = fopen("books.json", "r");
  if (!f) {
    *count = 0;
    return NULL;
  }

  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);

  if (size <= 0) {
    fclose(f);
    *count = 0;
    return NULL;
  }

  char *data = (char *)malloc(size + 1);
  size_t read_bytes = fread(data, 1, size, f);
  data[read_bytes] = '\0';
  fclose(f);

  Book *books = (Book *)malloc(sizeof(Book) * MAX_BOOKS);
  *count = 0;

  char *ptr = strchr(data, '{');
  while (ptr && *count < MAX_BOOKS) {
    char *end = strchr(ptr, '}');
    if (!end)
      break;

    char temp[1024];
    size_t block_len = end - ptr + 1;
    if (block_len >= sizeof(temp))
      block_len = sizeof(temp) - 1;
    strncpy(temp, ptr, block_len);
    temp[block_len] = '\0';

    if (!get_json_val(temp, "id", books[*count].id, sizeof(books[*count].id))) books[*count].id[0] = '\0';
    if (!get_json_val(temp, "name", books[*count].name, sizeof(books[*count].name))) books[*count].name[0] = '\0';
    if (!get_json_val(temp, "author", books[*count].author, sizeof(books[*count].author))) books[*count].author[0] = '\0';
    if (!get_json_val(temp, "genre", books[*count].genre, sizeof(books[*count].genre))) books[*count].genre[0] = '\0';
    if (!get_json_val(temp, "isbn", books[*count].isbn, sizeof(books[*count].isbn))) books[*count].isbn[0] = '\0';
    if (!get_json_val(temp, "cover", books[*count].cover, sizeof(books[*count].cover))) books[*count].cover[0] = '\0';
    if (!get_json_val(temp, "publisher", books[*count].publisher, sizeof(books[*count].publisher))) books[*count].publisher[0] = '\0';
    if (!get_json_val(temp, "edition", books[*count].edition, sizeof(books[*count].edition))) books[*count].edition[0] = '\0';
    if (!get_json_val(temp, "publication_year", books[*count].publication_year, sizeof(books[*count].publication_year))) books[*count].publication_year[0] = '\0';
    if (!get_json_val(temp, "language", books[*count].language, sizeof(books[*count].language))) books[*count].language[0] = '\0';
    if (!get_json_val(temp, "status", books[*count].status, sizeof(books[*count].status))) strcpy(books[*count].status, "Available");

    (*count)++;
    ptr = strchr(end + 1, '{');
  }

  free(data);
  return books;
}

Borrow *read_borrows(int *count) {
  ensure_json_file("borrows.json");
  FILE *f = fopen("borrows.json", "r");
  if (!f) {
    *count = 0;
    return NULL;
  }

  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);

  if (size <= 0) {
    fclose(f);
    *count = 0;
    return NULL;
  }

  char *data = (char *)malloc(size + 1);
  size_t read_bytes = fread(data, 1, size, f);
  data[read_bytes] = '\0';
  fclose(f);

  Borrow *borrows = (Borrow *)malloc(sizeof(Borrow) * MAX_BORROWS);
  *count = 0;

  char *ptr = strchr(data, '{');
  while (ptr && *count < MAX_BORROWS) {
    char *end = strchr(ptr, '}');
    if (!end) break;
    char temp[1024];
    size_t block_len = end - ptr + 1;
    if (block_len >= sizeof(temp)) block_len = sizeof(temp) - 1;
    strncpy(temp, ptr, block_len);
    temp[block_len] = '\0';

    if (!get_json_val(temp, "borrow_id", borrows[*count].borrow_id, sizeof(borrows[*count].borrow_id))) borrows[*count].borrow_id[0] = '\0';
    if (!get_json_val(temp, "book_id", borrows[*count].book_id, sizeof(borrows[*count].book_id))) borrows[*count].book_id[0] = '\0';
    if (!get_json_val(temp, "book_title", borrows[*count].book_title, sizeof(borrows[*count].book_title))) borrows[*count].book_title[0] = '\0';
    if (!get_json_val(temp, "student_name", borrows[*count].student_name, sizeof(borrows[*count].student_name))) borrows[*count].student_name[0] = '\0';
    if (!get_json_val(temp, "student_id", borrows[*count].student_id, sizeof(borrows[*count].student_id))) borrows[*count].student_id[0] = '\0';
    if (!get_json_val(temp, "borrow_date", borrows[*count].borrow_date, sizeof(borrows[*count].borrow_date))) borrows[*count].borrow_date[0] = '\0';
    if (!get_json_val(temp, "due_date", borrows[*count].due_date, sizeof(borrows[*count].due_date))) borrows[*count].due_date[0] = '\0';
    if (!get_json_val(temp, "return_date", borrows[*count].return_date, sizeof(borrows[*count].return_date))) borrows[*count].return_date[0] = '\0';
    if (!get_json_val(temp, "days_late", borrows[*count].days_late, sizeof(borrows[*count].days_late))) borrows[*count].days_late[0] = '\0';
    if (!get_json_val(temp, "fine", borrows[*count].fine, sizeof(borrows[*count].fine))) borrows[*count].fine[0] = '\0';
    if (!get_json_val(temp, "status", borrows[*count].status, sizeof(borrows[*count].status))) borrows[*count].status[0] = '\0';

    (*count)++;
    ptr = strchr(end + 1, '{');
  }
  free(data);
  return borrows;
}

Student *read_students(int *count) {
  ensure_json_file("students.json");
  FILE *f = fopen("students.json", "r");
  if (!f) { *count = 0; return NULL; }
  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);
  if (size <= 0) { fclose(f); *count = 0; return NULL; }
  char *data = (char *)malloc(size + 1);
  size_t read_bytes = fread(data, 1, size, f);
  data[read_bytes] = '\0';
  fclose(f);
  Student *students = (Student *)malloc(sizeof(Student) * 1000);
  *count = 0;
  char *ptr = strchr(data, '{');
  while (ptr && *count < 1000) {
    char *end = strchr(ptr, '}');
    if (!end) break;
    char temp[1024];
    size_t block_len = end - ptr + 1;
    if (block_len >= sizeof(temp)) block_len = sizeof(temp) - 1;
    strncpy(temp, ptr, block_len);
    temp[block_len] = '\0';
    if (!get_json_val(temp, "student_id", students[*count].student_id, sizeof(students[*count].student_id))) students[*count].student_id[0] = '\0';
    if (!get_json_val(temp, "name", students[*count].name, sizeof(students[*count].name))) students[*count].name[0] = '\0';
    if (!get_json_val(temp, "password", students[*count].password, sizeof(students[*count].password))) students[*count].password[0] = '\0';
    if (!get_json_val(temp, "email", students[*count].email, sizeof(students[*count].email))) students[*count].email[0] = '\0';
    if (!get_json_val(temp, "department", students[*count].department, sizeof(students[*count].department))) students[*count].department[0] = '\0';
    if (!get_json_val(temp, "year", students[*count].year, sizeof(students[*count].year))) students[*count].year[0] = '\0';
    (*count)++;
    ptr = strchr(end + 1, '{');
  }
  free(data);
  return students;
}

Admin *read_admins(int *count) {
  ensure_json_file("admins.json");
  FILE *f = fopen("admins.json", "r");
  if (!f) { *count = 0; return NULL; }
  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  rewind(f);
  if (size <= 0) { fclose(f); *count = 0; return NULL; }
  char *data = (char *)malloc(size + 1);
  size_t read_bytes = fread(data, 1, size, f);
  data[read_bytes] = '\0';
  fclose(f);
  Admin *admins = (Admin *)malloc(sizeof(Admin) * 1000);
  *count = 0;
  char *ptr = strchr(data, '{');
  while (ptr && *count < 1000) {
    char *end = strchr(ptr, '}');
    if (!end) break;
    char temp[1024];
    size_t block_len = end - ptr + 1;
    if (block_len >= sizeof(temp)) block_len = sizeof(temp) - 1;
    strncpy(temp, ptr, block_len);
    temp[block_len] = '\0';
    if (!get_json_val(temp, "username", admins[*count].username, sizeof(admins[*count].username))) admins[*count].username[0] = '\0';
    if (!get_json_val(temp, "password", admins[*count].password, sizeof(admins[*count].password))) admins[*count].password[0] = '\0';
    (*count)++;
    ptr = strchr(end + 1, '{');
  }
  free(data);
  return admins;
}

// ---------------- SAVE FILE ----------------
void save_books(Book *books, int count) {
  FILE *f = fopen("books.json", "w");
  if (!f)
    return;

  fprintf(f, "[\n");
  for (int i = 0; i < count; i++) {
    fprintf(f,
            "  {\n"
            "    \"id\": \"%s\",\n"
            "    \"name\": \"%s\",\n"
            "    \"author\": \"%s\",\n"
            "    \"genre\": \"%s\",\n"
            "    \"isbn\": \"%s\",\n"
            "    \"cover\": \"%s\",\n"
            "    \"publisher\": \"%s\",\n"
            "    \"edition\": \"%s\",\n"
            "    \"publication_year\": \"%s\",\n"
            "    \"language\": \"%s\",\n"
            "    \"status\": \"%s\"\n"
            "  }%s\n",
            books[i].id, books[i].name, books[i].author,
            books[i].genre, books[i].isbn, books[i].cover,
            books[i].publisher, books[i].edition, books[i].publication_year, books[i].language,
            books[i].status,
            (i < count - 1) ? "," : "");
  }
  fprintf(f, "]\n");

  fclose(f);
}

void save_borrows(Borrow *borrows, int count) {
  FILE *f = fopen("borrows.json", "w");
  if (!f) return;
  fprintf(f, "[\n");
  for (int i = 0; i < count; i++) {
    fprintf(f,
      "  {\n"
      "    \"borrow_id\": \"%s\",\n"
      "    \"book_id\": \"%s\",\n"
      "    \"book_title\": \"%s\",\n"
      "    \"student_name\": \"%s\",\n"
      "    \"student_id\": \"%s\",\n"
      "    \"borrow_date\": \"%s\",\n"
      "    \"due_date\": \"%s\",\n"
      "    \"return_date\": \"%s\",\n"
      "    \"days_late\": \"%s\",\n"
      "    \"fine\": \"%s\",\n"
      "    \"status\": \"%s\"\n"
      "  }%s\n",
      borrows[i].borrow_id, borrows[i].book_id, borrows[i].book_title, borrows[i].student_name, borrows[i].student_id,
      borrows[i].borrow_date, borrows[i].due_date, borrows[i].return_date, borrows[i].days_late, borrows[i].fine, borrows[i].status,
      (i < count - 1) ? "," : "");
  }
  fprintf(f, "]\n");
  fclose(f);
}

void save_students(Student *students, int count) {
  FILE *f = fopen("students.json", "w");
  if (!f) return;
  fprintf(f, "[\n");
  for (int i = 0; i < count; i++) {
    fprintf(f,
      "  {\n"
      "    \"student_id\": \"%s\",\n"
      "    \"name\": \"%s\",\n"
      "    \"email\": \"%s\",\n"
      "    \"department\": \"%s\",\n"
      "    \"year\": \"%s\",\n"
      "    \"password\": \"%s\"\n"
      "  }%s\n",
      students[i].student_id, students[i].name, students[i].email, 
      students[i].department, students[i].year, students[i].password,
      (i < count - 1) ? "," : "");
  }
  fprintf(f, "]\n");
  fclose(f);
}

// ---------------- SHOW APIS ----------------
void show_books() {
  int count;
  Book *books = read_books(&count);

  printf("Content-Type: application/json\r\n\r\n");
  printf("[\n");

  for (int i = 0; i < count; i++) {
    printf("  "
           "{\"id\":\"%s\",\"name\":\"%s\",\"author\":\"%s\","
           "\"genre\":\"%s\",\"isbn\":\"%s\",\"cover\":\"%s\","
           "\"publisher\":\"%s\",\"edition\":\"%s\",\"publication_year\":\"%s\",\"language\":\"%s\","
           "\"status\":\"%s\"}%s\n",
           books[i].id, books[i].name, books[i].author,
           books[i].genre, books[i].isbn, books[i].cover,
           books[i].publisher, books[i].edition, books[i].publication_year, books[i].language,
           books[i].status,
           (i < count - 1) ? "," : "");
  }

  printf("]\n");
  if (books)
    free(books);
}

void show_borrows() {
  int count;
  Borrow *borrows = read_borrows(&count);
  printf("Content-Type: application/json\r\n\r\n");
  printf("[\n");
  for (int i = 0; i < count; i++) {
    printf("  {\n"
      "    \"borrow_id\": \"%s\",\n"
      "    \"book_id\": \"%s\",\n"
      "    \"book_title\": \"%s\",\n"
      "    \"student_name\": \"%s\",\n"
      "    \"student_id\": \"%s\",\n"
      "    \"borrow_date\": \"%s\",\n"
      "    \"due_date\": \"%s\",\n"
      "    \"return_date\": \"%s\",\n"
      "    \"days_late\": \"%s\",\n"
      "    \"fine\": \"%s\",\n"
      "    \"status\": \"%s\"\n"
      "  }%s\n",
      borrows[i].borrow_id, borrows[i].book_id, borrows[i].book_title, borrows[i].student_name, borrows[i].student_id,
      borrows[i].borrow_date, borrows[i].due_date, borrows[i].return_date, borrows[i].days_late, borrows[i].fine, borrows[i].status,
      (i < count - 1) ? "," : "");
  }
  printf("]\n");
  if (borrows) free(borrows);
}

// ---------------- HELPER FOR POST RESPONSES ----------------
void send_response(int status, const char *msg) {
  if (status == 200) {
    printf("Status: 200 OK\r\n");
  } else {
    printf("Status: 400 Bad Request\r\n");
  }
  printf("Content-Type: application/json\r\n\r\n");
  printf("{\"status\": \"%s\"}\n", msg);
}

// ---------------- MAIN ----------------
int main() {
#ifdef _WIN32
  _setmode(_fileno(stdout), _O_BINARY);
  _setmode(_fileno(stdin),  _O_BINARY);
#endif

  char *method = getenv("REQUEST_METHOD");

  if (!method) {
    method = "GET";
  }

  if (strcmp(method, "GET") == 0) {
    char *query = getenv("QUERY_STRING");
    if (query && strstr(query, "type=borrows")) {
      show_borrows();
    } else {
      show_books();
    }
    return 0;
  }

  if (strcmp(method, "POST") == 0) {
    char *len_str = getenv("CONTENT_LENGTH");
    if (!len_str) {
      send_response(400, "Missing Content-Length");
      return 0;
    }

    int len = atoi(len_str);
    if (len <= 0) {
      send_response(400, "Invalid Content-Length");
      return 0;
    }

    char *body = malloc(len + 1);
    if (!body) {
      send_response(500, "Memory Allocation Failed");
      return 0;
    }

    size_t actual_read = fread(body, 1, len, stdin);
    body[actual_read] = '\0';

    char action[20] = {0};
    if (!get_json_val(body, "action", action, sizeof(action))) {
      send_response(400, "Missing action");
      free(body);
      return 0;
    }

    int count = 0;
    Book *books = read_books(&count);
    if (!books) {
      books = (Book *)malloc(sizeof(Book) * MAX_BOOKS);
      count = 0;
    }

    // ---------- ADD BOOK ----------
    if (strcmp(action, "add") == 0) {
      if (count >= MAX_BOOKS) {
        send_response(400, "Database full");
      } else {
        char new_id[50] = {0};
        get_json_val(body, "id", new_id, sizeof(new_id));

        int duplicate = 0;
        for (int i = 0; i < count; i++) {
          if (strcmp(books[i].id, new_id) == 0) {
            duplicate = 1;
            break;
          }
        }

        if (!duplicate) {
          strncpy(books[count].id, new_id, sizeof(books[count].id) - 1);
          get_json_val(body, "name", books[count].name,
                       sizeof(books[count].name));
          get_json_val(body, "author", books[count].author,
                       sizeof(books[count].author));
          if (!get_json_val(body, "genre", books[count].genre, sizeof(books[count].genre))) books[count].genre[0] = '\0';
          if (!get_json_val(body, "isbn", books[count].isbn, sizeof(books[count].isbn))) books[count].isbn[0] = '\0';
          if (!get_json_val(body, "cover", books[count].cover, sizeof(books[count].cover))) books[count].cover[0] = '\0';
          if (!get_json_val(body, "publisher", books[count].publisher, sizeof(books[count].publisher))) books[count].publisher[0] = '\0';
          if (!get_json_val(body, "edition", books[count].edition, sizeof(books[count].edition))) books[count].edition[0] = '\0';
          if (!get_json_val(body, "publication_year", books[count].publication_year, sizeof(books[count].publication_year))) books[count].publication_year[0] = '\0';
          if (!get_json_val(body, "language", books[count].language, sizeof(books[count].language))) books[count].language[0] = '\0';
          strcpy(books[count].status, "Available");

          count++;
          save_books(books, count);
          send_response(200, "Added");
        } else {
          send_response(400, "Duplicate ID");
        }
      }
    }
    // ---------- BORROW BOOK ----------
    else if (strcmp(action, "borrow") == 0) {
      char target_id[50] = {0};
      char student[100] = {0};
      get_json_val(body, "id", target_id, sizeof(target_id));
      get_json_val(body, "student", student, sizeof(student));
      
      char borrow_id[50] = {0}, book_title[100] = {0}, student_id[50] = {0};
      char borrow_date[50] = {0}, due_date[50] = {0};
      get_json_val(body, "borrow_id", borrow_id, sizeof(borrow_id));
      get_json_val(body, "book_title", book_title, sizeof(book_title));
      get_json_val(body, "student_id", student_id, sizeof(student_id));
      get_json_val(body, "borrow_date", borrow_date, sizeof(borrow_date));
      get_json_val(body, "due_date", due_date, sizeof(due_date));

      int s_count = 0;
      Student *all_students = read_students(&s_count);
      int student_exists = 0;
      if (all_students) {
          for(int i = 0; i < s_count; i++) {
              if (strcmp(all_students[i].student_id, student_id) == 0) {
                  student_exists = 1;
                  if (strlen(student) == 0) {
                      strncpy(student, all_students[i].name, sizeof(student) - 1);
                      student[sizeof(student) - 1] = '\0';
                  }
                  break;
              }
          }
          free(all_students);
      }

      if (!student_exists) {
          send_response(400, "Student ID not found. The student must register before borrowing books.");
      } else {
          int found = 0;
          for (int i = 0; i < count; i++) {
            if (strcmp(books[i].id, target_id) == 0) {
              if (strcmp(books[i].status, "Available") != 0) {
                send_response(400, "Already Borrowed");
                found = -1;
                break;
              }
              strcpy(books[i].status, "Borrowed");
              
              if (strlen(book_title) == 0) {
                strncpy(book_title, books[i].name, sizeof(book_title) - 1);
                book_title[sizeof(book_title) - 1] = '\0';
              }
              found = 1;
              break;
            }
          }
          if (found == 1) {
            save_books(books, count);

            int b_count = 0;
            Borrow *borrows = read_borrows(&b_count);
        if (!borrows) {
          borrows = (Borrow *)malloc(sizeof(Borrow) * MAX_BORROWS);
          b_count = 0;
        }
        if (b_count < MAX_BORROWS) {
          strncpy(borrows[b_count].borrow_id, borrow_id, sizeof(borrows[b_count].borrow_id) - 1);
          strncpy(borrows[b_count].book_id, target_id, sizeof(borrows[b_count].book_id) - 1);
          strncpy(borrows[b_count].book_title, book_title, sizeof(borrows[b_count].book_title) - 1);
          strncpy(borrows[b_count].student_name, student, sizeof(borrows[b_count].student_name) - 1);
          strncpy(borrows[b_count].student_id, student_id, sizeof(borrows[b_count].student_id) - 1);
          strncpy(borrows[b_count].borrow_date, borrow_date, sizeof(borrows[b_count].borrow_date) - 1);
          strncpy(borrows[b_count].due_date, due_date, sizeof(borrows[b_count].due_date) - 1);
          borrows[b_count].return_date[0] = '\0';
          strcpy(borrows[b_count].days_late, "0");
          strcpy(borrows[b_count].fine, "0");
          strcpy(borrows[b_count].status, "Borrowed");
          b_count++;
          save_borrows(borrows, b_count);
        }
        if (borrows) free(borrows);

        send_response(200, "Borrowed");
      } else if (found == 0) {
        send_response(400, "Not Found");
      }
      }
    }
    // ---------- RETURN BOOK ----------
    else if (strcmp(action, "return") == 0) {
      char target_id[50] = {0};
      get_json_val(body, "id", target_id, sizeof(target_id));
      
      char return_date[50] = {0}, days_late[20] = {0}, fine[20] = {0}, status[50] = {0};
      get_json_val(body, "return_date", return_date, sizeof(return_date));
      get_json_val(body, "days_late", days_late, sizeof(days_late));
      get_json_val(body, "fine", fine, sizeof(fine));
      get_json_val(body, "status", status, sizeof(status));

      int found = 0;
      for (int i = 0; i < count; i++) {
        if (strcmp(books[i].id, target_id) == 0) {
          strcpy(books[i].status, "Available");
          found = 1;
          break;
        }
      }
      if (found) {
        save_books(books, count);

        int b_count = 0;
        Borrow *borrows = read_borrows(&b_count);
        if (borrows) {
          for (int i = 0; i < b_count; i++) {
            if (strcmp(borrows[i].book_id, target_id) == 0 && strcmp(borrows[i].status, "Borrowed") == 0) {
              strncpy(borrows[i].return_date, return_date, sizeof(borrows[i].return_date) - 1);
              strncpy(borrows[i].days_late, days_late, sizeof(borrows[i].days_late) - 1);
              strncpy(borrows[i].fine, fine, sizeof(borrows[i].fine) - 1);
              strncpy(borrows[i].status, status, sizeof(borrows[i].status) - 1);
              break;
            }
          }
          save_borrows(borrows, b_count);
          free(borrows);
        }
        send_response(200, "Returned");
      } else {
        send_response(400, "Not Found");
      }
    }
    // ---------- DELETE BOOK ----------
    else if (strcmp(action, "delete") == 0) {
      char target_id[50] = {0};
      get_json_val(body, "id", target_id, sizeof(target_id));

      int found = 0;
      for (int i = 0; i < count; i++) {
        if (strcmp(books[i].id, target_id) == 0) {
          for (int j = i; j < count - 1; j++) {
            books[j] = books[j + 1];
          }
          count--;
          found = 1;
          break;
        }
      }
      if (found) {
        save_books(books, count);
        send_response(200, "Deleted");
      } else {
        send_response(400, "Not Found");
      }
    }
    // ---------- LOGIN ----------
    else if (strcmp(action, "login") == 0) {
      char role[50] = {0};
      get_json_val(body, "role", role, sizeof(role));
      
      if (strcmp(role, "Admin") == 0) {
        char username[100] = {0}, password[100] = {0};
        get_json_val(body, "username", username, sizeof(username));
        get_json_val(body, "password", password, sizeof(password));
        
        int a_count = 0;
        Admin *admins = read_admins(&a_count);
        int valid = 0;
        if (admins) {
          for (int i = 0; i < a_count; i++) {
            if (strcmp(admins[i].username, username) == 0 && strcmp(admins[i].password, password) == 0) {
              valid = 1;
              break;
            }
          }
          free(admins);
        }
        if (valid) send_response(200, "Login Successful");
        else {
          printf("Status: 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{\"status\": \"Invalid Admin Credentials\"}\n");
        }
      } 
      else if (strcmp(role, "Student") == 0) {
        char student_id[50] = {0}, password[100] = {0};
        get_json_val(body, "student_id", student_id, sizeof(student_id));
        get_json_val(body, "password", password, sizeof(password));
        
        int s_count = 0;
        Student *students = read_students(&s_count);
        int found_student = 0;
        int valid_password = 0;
        char s_name[100] = {0};
        if (students) {
          for (int i = 0; i < s_count; i++) {
            if (strcmp(students[i].student_id, student_id) == 0) {
              found_student = 1;
              if (strcmp(students[i].password, password) == 0) {
                valid_password = 1;
                strncpy(s_name, students[i].name, sizeof(s_name));
                s_name[sizeof(s_name) - 1] = '\0';
              }
              break;
            }
          }
          free(students);
        }
        if (valid_password) {
            printf("Status: 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"Login Successful\",\"student_name\":\"%s\"}\n", s_name);
        } else if (!found_student) {
            printf("Status: 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"status\": \"No account found for Student ID '%s'.<br>Please sign up first.\"}\n", student_id);
        } else {
            printf("Status: 401 Unauthorized\r\nContent-Type: application/json\r\n\r\n{\"status\": \"Incorrect password.\"}\n");
        }
      } 
      else {
        send_response(400, "Invalid Role");
      }
    }
    // ---------- REGISTER STUDENT ----------
    else if (strcmp(action, "register_student") == 0) {
      char student_id[50] = {0}, name[100] = {0}, email[100] = {0}, department[100] = {0}, year[50] = {0}, password[100] = {0};
      get_json_val(body, "student_id", student_id, sizeof(student_id));
      get_json_val(body, "name", name, sizeof(name));
      get_json_val(body, "email", email, sizeof(email));
      get_json_val(body, "department", department, sizeof(department));
      get_json_val(body, "year", year, sizeof(year));
      get_json_val(body, "password", password, sizeof(password));

      int s_count = 0;
      Student *students = read_students(&s_count);
      
      int exists = 0;
      if (students) {
        for (int i = 0; i < s_count; i++) {
          if (strcmp(students[i].student_id, student_id) == 0 || strcmp(students[i].email, email) == 0) {
            exists = 1;
            break;
          }
        }
      } else {
        students = (Student *)malloc(sizeof(Student) * 1000); // Allocate if NULL
      }

      if (exists) {
        printf("Status: 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"status\": \"Student ID or Email already exists\"}\n");
      } else if (s_count >= 1000) {
        printf("Status: 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n{\"status\": \"Database full\"}\n");
      } else {
        strncpy(students[s_count].student_id, student_id, sizeof(students[s_count].student_id) - 1);
        strncpy(students[s_count].name, name, sizeof(students[s_count].name) - 1);
        strncpy(students[s_count].email, email, sizeof(students[s_count].email) - 1);
        strncpy(students[s_count].department, department, sizeof(students[s_count].department) - 1);
        strncpy(students[s_count].year, year, sizeof(students[s_count].year) - 1);
        strncpy(students[s_count].password, password, sizeof(students[s_count].password) - 1);
        
        s_count++;
        save_students(students, s_count);
        printf("Status: 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\": \"Registration successful\"}\n");
      }
      if (students) free(students);
    } else {
      send_response(400, "Invalid Action");
    }

    if (books)
      free(books);
    free(body);
  }

  return 0;
}