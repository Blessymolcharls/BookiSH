#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_BOOKS 1000

// ---------------- STRUCT ----------------
typedef struct {
  char id[50];
  char name[100];
  char author[100];
  char student[100];
} Book;

// ---------------- SAFE JSON EXTRACTION ----------------
// Extracts a string value from simple JSON
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
  return out;
}

// ---------------- READ FILE ----------------
Book *read_books(int *count) {
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

    get_json_val(temp, "id", books[*count].id, sizeof(books[*count].id));
    get_json_val(temp, "name", books[*count].name, sizeof(books[*count].name));
    get_json_val(temp, "author", books[*count].author,
                 sizeof(books[*count].author));

    if (!get_json_val(temp, "student", books[*count].student,
                      sizeof(books[*count].student))) {
      books[*count].student[0] = '\0';
    }

    (*count)++;
    ptr = strchr(end + 1, '{');
  }

  free(data);
  return books;
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
            "    \"student\": \"%s\"\n"
            "  }%s\n",
            books[i].id, books[i].name, books[i].author, books[i].student,
            (i < count - 1) ? "," : "");
  }
  fprintf(f, "]\n");

  fclose(f);
}

// ---------------- SHOW BOOKS (GET API) ----------------
void show_books() {
  int count;
  Book *books = read_books(&count);

  printf("Content-Type: application/json\r\n\r\n");
  printf("[\n");

  for (int i = 0; i < count; i++) {
    printf("  "
           "{\"id\":\"%s\",\"name\":\"%s\",\"author\":\"%s\",\"student\":\"%"
           "s\"}%s\n",
           books[i].id, books[i].name, books[i].author, books[i].student,
           (i < count - 1) ? "," : "");
  }

  printf("]\n");
  if (books)
    free(books);
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
  char *method = getenv("REQUEST_METHOD");

  // Default to GET if not set (for basic CLI testing)
  if (!method) {
    method = "GET";
  }

  if (strcmp(method, "GET") == 0) {
    show_books();
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
          books[count].student[0] = '\0'; // Not borrowed yet

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

      int found = 0;
      for (int i = 0; i < count; i++) {
        if (strcmp(books[i].id, target_id) == 0) {
          if (strlen(books[i].student) > 0) {
            send_response(400, "Already Borrowed");
            found = -1;
            break;
          }
          strncpy(books[i].student, student, sizeof(books[i].student) - 1);
          books[i].student[sizeof(books[i].student) - 1] = '\0';
          found = 1;
          break;
        }
      }
      if (found == 1) {
        save_books(books, count);
        send_response(200, "Borrowed");
      } else if (found == 0) {
        send_response(400, "Not Found");
      }
    }
    // ---------- RETURN BOOK ----------
    else if (strcmp(action, "return") == 0) {
      char target_id[50] = {0};
      get_json_val(body, "id", target_id, sizeof(target_id));

      int found = 0;
      for (int i = 0; i < count; i++) {
        if (strcmp(books[i].id, target_id) == 0) {
          books[i].student[0] = '\0';
          found = 1;
          break;
        }
      }
      if (found) {
        save_books(books, count);
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
    } else {
      send_response(400, "Invalid Action");
    }

    if (books)
      free(books);
    free(body);
  }

  return 0;
}