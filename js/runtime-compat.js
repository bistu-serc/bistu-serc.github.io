(function () {
  var API_HOSTS = {
    "127.0.0.1:5000": true,
    "localhost:5000": true
  };

  var dataCache = {};

  function stripBom(value) {
    return typeof value === "string" ? value.replace(/^\uFEFF/, "") : value;
  }

  function parseCsv(text) {
    var source = stripBom(String(text || "")).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var rows = [];
    var row = [];
    var cell = "";
    var inQuotes = false;
    var i;

    for (i = 0; i < source.length; i += 1) {
      var ch = source.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (source.charAt(i + 1) === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }

    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    if (!rows.length) {
      return [];
    }

    var headers = rows[0].map(function (header) {
      return stripBom(String(header || "")).trim();
    });

    return rows.slice(1).filter(function (cols) {
      return cols.some(function (col) {
        return String(col || "").trim() !== "";
      });
    }).map(function (cols) {
      var obj = {};
      headers.forEach(function (header, index) {
        obj[header] = typeof cols[index] === "undefined" ? "" : String(cols[index]);
      });
      return obj;
    });
  }

  function readCsv(path) {
    if (!dataCache[path]) {
      dataCache[path] = fetch(path)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Failed to fetch " + path + ": " + response.status);
          }
          return response.text();
        })
        .then(parseCsv);
    }
    return dataCache[path];
  }

  function readJson(path) {
    if (!dataCache[path]) {
      dataCache[path] = fetch(path)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Failed to fetch " + path + ": " + response.status);
          }
          return response.json();
        });
    }
    return dataCache[path];
  }

  function isAlive(record) {
    var flag = record && (record.isDel || record.isdel || "0");
    return String(flag || "0") !== "1";
  }

  function includesAuthor(author, target) {
    var left = String(author || "");
    var right = String(target || "");
    return !!right && left.indexOf(right) !== -1;
  }

  function parseAuthorized(value) {
    var normalized = String(value || "").trim();
    if (normalized === "1" || normalized.toLowerCase() === "true") {
      return "1";
    }
    if (normalized === "0" || normalized.toLowerCase() === "false") {
      return "0";
    }
    return normalized;
  }

  function toURL(input) {
    try {
      if (typeof input === "string") {
        return new URL(input, window.location.href);
      }
      if (input && typeof input.url === "string") {
        return new URL(input.url, window.location.href);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function getApiPath(input) {
    var parsed = toURL(input);
    if (!parsed) {
      return null;
    }
    var host = parsed.hostname + (parsed.port ? ":" + parsed.port : "");
    if (!API_HOSTS[host]) {
      return null;
    }
    try {
      return decodeURIComponent(parsed.pathname || "/");
    } catch (error) {
      return parsed.pathname || "/";
    }
  }

  function createStudentsGroupedPayload(students) {
    var masterList = [];
    var phdList = [];

    students.forEach(function (student) {
      var year = student.year || "";
      var item = {
        id: student.id,
        name: student.name,
        name_en: student.name_en,
        year: year,
        degree: student.degree
      };
      if (String(student.degree || "0") === "1") {
        phdList.push(item);
      } else {
        masterList.push(item);
      }
    });

    return {
      masterList: masterList,
      phdList: phdList
    };
  }

  function buildResearchShowPayload() {
    return Promise.all([
      readCsv("data/papers.csv"),
      readCsv("data/patents.csv"),
      readCsv("data/copyrights.csv")
    ]).then(function (all) {
      var papers = all[0].filter(isAlive);
      var patents = all[1].filter(isAlive);
      var copyrights = all[2].filter(isAlive);
      var journalCount = 0;
      var conferenceCount = 0;

      papers.forEach(function (paper) {
        var type = String(paper.type || "").toLowerCase();
        if (type.indexOf("journal") !== -1) {
          journalCount += 1;
        } else if (type.indexOf("conference") !== -1) {
          conferenceCount += 1;
        }
      });

      var authorizedCount = patents.filter(function (patent) {
        return parseAuthorized(patent.authorized) === "1";
      }).length;

      return {
        paper: papers,
        type_count: {
          conference: conferenceCount,
          journal: journalCount
        },
        patent: {
          authorized: authorizedCount,
          unauthorized: Math.max(patents.length - authorizedCount, 0)
        },
        copyright_num: copyrights.length
      };
    });
  }

  function resolveApiPayload(pathname) {
    var path = String(pathname || "");

    if (path === "/teacher/findAll") {
      return readCsv("data/teachers.csv").then(function (teachers) {
        return teachers.filter(isAlive);
      });
    }

    if (path.indexOf("/teacher/findByName/") === 0) {
      var teacherName = path.slice("/teacher/findByName/".length);
      return readCsv("data/teachers.csv").then(function (teachers) {
        return teachers.filter(isAlive).find(function (teacher) {
          return teacher.name === teacherName || teacher.name_en === teacherName;
        }) || {};
      });
    }

    if (path === "/student/findYearAndName") {
      return readCsv("data/students.csv").then(function (students) {
        return createStudentsGroupedPayload(students.filter(isAlive));
      });
    }

    if (path.indexOf("/student/findByName/") === 0) {
      var studentName = path.slice("/student/findByName/".length);
      return readCsv("data/students.csv").then(function (students) {
        return students.filter(isAlive).find(function (student) {
          return student.name === studentName || student.name_en === studentName;
        }) || {};
      });
    }

    if (path === "/paper/findAll") {
      return readCsv("data/papers.csv").then(function (papers) {
        return papers.filter(isAlive);
      });
    }

    if (path.indexOf("/paper/findByAuthor/") === 0) {
      var suffix = path.slice("/paper/findByAuthor/".length);
      var parts = suffix.split("/");
      var authorName = parts[0] || "";
      var authorNameEn = parts.slice(1).join("/") || "";

      return readCsv("data/papers.csv").then(function (papers) {
        return papers.filter(isAlive).filter(function (paper) {
          return includesAuthor(paper.author, authorName) || includesAuthor(paper.author, authorNameEn);
        });
      });
    }

    if (path === "/patent/findAll") {
      return readCsv("data/patents.csv").then(function (patents) {
        return patents.filter(isAlive);
      });
    }

    if (path.indexOf("/patent/findByAuthorized/") === 0) {
      var authorized = parseAuthorized(path.slice("/patent/findByAuthorized/".length));
      return readCsv("data/patents.csv").then(function (patents) {
        return patents.filter(isAlive).filter(function (patent) {
          return parseAuthorized(patent.authorized) === authorized;
        });
      });
    }

    if (path.indexOf("/patent/findByAuthor/") === 0) {
      var patentAuthor = path.slice("/patent/findByAuthor/".length);
      return readCsv("data/patents.csv").then(function (patents) {
        return patents.filter(isAlive).filter(function (patent) {
          return includesAuthor(patent.author, patentAuthor);
        });
      });
    }

    if (path === "/copyright/findAll") {
      return readCsv("data/copyrights.csv").then(function (copyrights) {
        return copyrights.filter(isAlive);
      });
    }

    if (path === "/findResearchShow") {
      return buildResearchShowPayload();
    }

    return Promise.reject(new Error("No static fallback route for " + path));
  }

  if (typeof window.fetch === "function") {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var apiPath = getApiPath(input);
      if (!apiPath) {
        return nativeFetch(input, init);
      }
      return resolveApiPayload(apiPath).then(function (payload) {
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }).catch(function () {
        return nativeFetch(input, init);
      });
    };
  }

  if (typeof window.XMLHttpRequest !== "undefined") {
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;
    var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    function callNativeOpen(xhr, method, url, asyncFlag, user, password) {
      if (typeof user !== "undefined") {
        originalOpen.call(xhr, method, url, asyncFlag, user, password);
      } else {
        originalOpen.call(xhr, method, url, asyncFlag);
      }
    }

    XMLHttpRequest.prototype.open = function (method, url, asyncFlag, user, password) {
      var apiPath = getApiPath(url);
      if (!apiPath) {
        this.__sercFallbackMeta = null;
        return originalOpen.apply(this, arguments);
      }

      this.__sercFallbackMeta = {
        method: method,
        path: apiPath,
        asyncFlag: asyncFlag !== false,
        user: user,
        password: password,
        headers: []
      };
      return undefined;
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (this.__sercFallbackMeta) {
        this.__sercFallbackMeta.headers.push([name, value]);
        return undefined;
      }
      return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      var xhr = this;
      var meta = this.__sercFallbackMeta;

      if (!meta) {
        return originalSend.call(this, body);
      }

      this.__sercFallbackMeta = null;

      resolveApiPayload(meta.path).then(function (payload) {
        var blob = new Blob([JSON.stringify(payload)], {
          type: "application/json"
        });
        var blobUrl = URL.createObjectURL(blob);

        callNativeOpen(xhr, meta.method || "GET", blobUrl, meta.asyncFlag, meta.user, meta.password);

        meta.headers.forEach(function (entry) {
          try {
            originalSetRequestHeader.call(xhr, entry[0], entry[1]);
          } catch (error) {
            /* ignore invalid header in fallback mode */
          }
        });

        xhr.addEventListener("loadend", function cleanup() {
          URL.revokeObjectURL(blobUrl);
        }, { once: true });

        originalSend.call(xhr, null);
      }).catch(function () {
        callNativeOpen(xhr, meta.method || "GET", "data:application/json,%7B%7D", meta.asyncFlag, meta.user, meta.password);
        originalSend.call(xhr, null);
      });

      return undefined;
    };
  }

  function optimizeImages(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var images = scope.querySelectorAll ? scope.querySelectorAll("img") : [];

    Array.prototype.forEach.call(images, function (img, index) {
      if (!img.getAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }

      if (img.getAttribute("loading")) {
        return;
      }

      var isCritical =
        !!img.closest("#ShowPicture") ||
        !!img.closest(".el-carousel") ||
        !!img.closest("#navbar") ||
        !!img.closest("nav") ||
        index < 3;

      if (!isCritical) {
        img.setAttribute("loading", "lazy");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      optimizeImages(document);
    });
  } else {
    optimizeImages(document);
  }

  window.addEventListener("load", function () {
    optimizeImages(document);
  });

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) {
            return;
          }
          if (node.tagName && node.tagName.toLowerCase() === "img") {
            optimizeImages(node.parentNode || document);
          } else if (node.querySelectorAll) {
            optimizeImages(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
