(function () {
  var API_HOSTS = {
    "127.0.0.1:5000": true,
    "localhost:5000": true
  };

  var dataCache = {};
  var introOriginalHtml = null;
  var cultureImageObserver = null;
  var enhancementQueuePending = false;
  var enhancementScheduledRoot = null;
  var resizeDebounceTimer = null;
  var HOME_INTRO_SUMMARY =
    "北京信息科技大学软件工程研究中心源于1979年设立的“软件工程研究与开发中心”，长期承担国家重点科研与工程任务，见证并推动了我国软件工程技术与相关标准的发展。中心面向“软件分析与测试、智能软件工程、可信人工智能”三大方向，形成了从理论方法、关键算法到系统平台与工具落地的完整能力链，在模糊测试、符号执行、自动化测试、漏洞检测与安全评估等方面具备扎实工程实力。依托导师与学生协同团队，中心持续产出高水平论文、专利与软著，主持多类纵向与横向项目，并建设可服务教学科研与产业应用的软件工具体系，体现了“科研创新+工程实现+成果转化”一体化特色。";

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

  function isElementNode(node) {
    return !!node && node.nodeType === 1;
  }

  function normalizeScopeRoot(root) {
    return isElementNode(root) ? root : document;
  }

  function collectImages(root) {
    var scope = normalizeScopeRoot(root);
    if (scope.tagName && scope.tagName.toLowerCase() === "img") {
      return [scope];
    }
    return scope.querySelectorAll ? scope.querySelectorAll("img") : [];
  }

  function optimizeImages(root) {
    var scope = normalizeScopeRoot(root);
    var isDocumentScope = scope === document;
    var images = collectImages(root);

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
        (isDocumentScope && index < 3);

      if (!isCritical) {
        img.setAttribute("loading", "lazy");
      } else if (!img.getAttribute("fetchpriority") && img.closest("#ShowPicture")) {
        img.setAttribute("fetchpriority", "high");
      }
    });
  }

  function isCultureRoute() {
    return /^#\/culture(?:$|[/?])/.test(window.location.hash || "");
  }

  function getCultureImageObserver() {
    if (typeof IntersectionObserver === "undefined") {
      return null;
    }

    if (!cultureImageObserver) {
      cultureImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var target = entry.target;
          var lazySrc = target && target.dataset ? target.dataset.cultureLazySrc : "";
          if (lazySrc && !target.getAttribute("src")) {
            target.setAttribute("src", lazySrc);
          }
          observer.unobserve(target);
        });
      }, {
        rootMargin: "220px 0px"
      });
    }

    return cultureImageObserver;
  }

  function releaseCultureImageObserver() {
    if (!cultureImageObserver) {
      return;
    }
    cultureImageObserver.disconnect();
    cultureImageObserver = null;
  }

  function enableCultureLazyImage(img, index, io) {
    if (!img || img.nodeType !== 1) {
      return;
    }

    img.setAttribute("decoding", "async");

    if (index < 6) {
      img.dataset.cultureLazyProcessed = "keep";
      return;
    }

    if (img.dataset.cultureLazyApplied === "1") {
      return;
    }

    var originalSrc = img.getAttribute("src");
    if (!originalSrc) {
      return;
    }

    img.dataset.cultureLazySrc = originalSrc;
    img.dataset.cultureLazyApplied = "1";
    img.dataset.cultureLazyProcessed = "1";
    img.removeAttribute("src");
    img.setAttribute("loading", "lazy");
    img.setAttribute("fetchpriority", "low");

    if (!io) {
      img.setAttribute("src", originalSrc);
      return;
    }

    io.observe(img);
  }

  function optimizeCultureRouteImages(root) {
    if (!isCultureRoute()) {
      releaseCultureImageObserver();
      return;
    }

    var scope = normalizeScopeRoot(root);
    var cultureImages = [];

    if (
      scope.tagName &&
      scope.tagName.toLowerCase() === "img" &&
      scope.closest &&
      scope.closest("#culture_list")
    ) {
      cultureImages = [scope];
    } else if (scope.querySelectorAll) {
      cultureImages = scope.querySelectorAll("#culture_list img, #culture_list .el-image__inner");
    }

    var io = getCultureImageObserver();

    Array.prototype.forEach.call(cultureImages, function (img, index) {
      enableCultureLazyImage(img, index, io);
    });
  }

  function alignFooterContactLine(line) {
    if (!line || line.nodeType !== 1 || line.dataset.footerContactAligned === "1") {
      return;
    }

    var leadingText = "";
    if (line.firstChild && line.firstChild.nodeType === 3) {
      leadingText = line.firstChild.nodeValue || "";
    } else {
      leadingText = line.textContent || "";
    }

    var matched = String(leadingText).match(/^\s*([^：:]{1,16})[：:]\s*(.*)$/);
    if (!matched) {
      var whole = String(line.textContent || "").trim();
      matched = whole.match(/^([^：:]{1,16})[：:]\s*(.+)$/);
      if (!matched) {
        return;
      }
      line.textContent = matched[2];
    } else if (line.firstChild && line.firstChild.nodeType === 3) {
      line.firstChild.nodeValue = matched[2];
    }

    var label = document.createElement("span");
    label.className = "footer-contact-label";
    label.textContent = String(matched[1] || "").trim();

    var value = document.createElement("span");
    value.className = "footer-contact-value";

    while (line.firstChild) {
      value.appendChild(line.firstChild);
    }

    line.classList.add("footer-contact-line");
    line.appendChild(label);
    line.appendChild(value);
    line.dataset.footerContactAligned = "1";
  }

  function optimizeFooterContactLayout(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var contactLines = scope.querySelectorAll
      ? scope.querySelectorAll(".footer .col-lg-4.margin-t-20:last-child .text-muted.margin-t-20 p")
      : [];

    Array.prototype.forEach.call(contactLines, function (line) {
      alignFooterContactLine(line);
    });
  }

  function optimizeFooterBranding() {
    var brandTitle = document.querySelector(".footer .row > .col-lg-4.margin-t-20:first-child h4");
    if (brandTitle) {
      var raw = String(brandTitle.textContent || "").trim();
      var normalized = raw.replace(/^©\s*20\d{2}\s*/i, "").trim();
      if (normalized) {
        brandTitle.textContent = "©2026 " + normalized;
      }
    }
  }

  function optimizeNavbarBrand() {
    var brandContainer = document.querySelector("#navbar .container > div:first-child");
    if (!brandContainer) {
      return;
    }

    brandContainer.classList.add("serc-brand-container");
    brandContainer.style.marginLeft = "0";

    var link = brandContainer.querySelector("a");
    if (!link) {
      return;
    }

    link.classList.add("serc-brand-link");

    var hasCustomBrand =
      !!link.querySelector(".serc-brand-logo") &&
      !!link.querySelector(".serc-brand-title");

    if (hasCustomBrand) {
      return;
    }

    link.innerHTML = ""
      + '<span class="serc-brand-wrap">'
      + '<img class="serc-brand-logo" src="img/bistu_logo.png" alt="北京信息科技大学校徽" decoding="async">'
      + '<span class="serc-brand-title">北京信息科技大学软件工程研究中心</span>'
      + "</span>";
  }

  function ensureAboutNavLink(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var navLists = scope.querySelectorAll ? scope.querySelectorAll("#mySidenav") : [];

    Array.prototype.forEach.call(navLists, function (list) {
      if (!list || !list.querySelector || list.querySelector('a.nav-link[href="#/about"]')) {
        return;
      }

      var item = document.createElement("li");
      item.className = "nav-item";

      var link = document.createElement("a");
      link.className = "nav-link";
      link.setAttribute("href", "#/about");
      link.textContent = "关于";

      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function normalizeNavLabels(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll
      ? scope.querySelectorAll("#mySidenav a.nav-link, .footer-list a")
      : [];

    var textFallbackMap = {
      "主页": "首页",
      "中心动态": "动态",
      "学术成果": "学术",
      "学生信息": "团队",
      "中心建设": "文化",
      "工具展示": "软件",
      "关于我们": "关于"
    };

    Array.prototype.forEach.call(links, function (link) {
      var href = String(link.getAttribute("href") || "").trim();
      var nextText = "";

      if (href === "/" || href === "#/") {
        nextText = "首页";
      } else if (href.indexOf("#/newList") === 0) {
        nextText = "动态";
      } else if (href.indexOf("#/achievement") === 0) {
        nextText = "学术";
      } else if (href.indexOf("#/studentList") === 0) {
        nextText = "团队";
      } else if (href.indexOf("#/culture") === 0) {
        nextText = "文化";
      } else if (href.indexOf("#/tool") === 0) {
        nextText = "软件";
      } else if (href.indexOf("#/about") === 0) {
        nextText = "关于";
      } else {
        var currentText = String(link.textContent || "").trim();
        if (textFallbackMap[currentText]) {
          nextText = textFallbackMap[currentText];
        }
      }

      if (nextText) {
        link.textContent = nextText;
      }
    });
  }

  function upsertRouteTitle(parent, beforeNode, text, key) {
    if (!parent) {
      return null;
    }

    var title = parent.querySelector('.route-page-title[data-route-title-key="' + key + '"]');
    if (!title) {
      title = document.createElement("h1");
      title.className = "route-page-title";
      title.dataset.routeTitleKey = key;
      if (beforeNode && beforeNode.parentNode === parent) {
        parent.insertBefore(title, beforeNode);
      } else {
        parent.insertBefore(title, parent.firstChild);
      }
    }
    title.textContent = text;
    return title;
  }

  function getCurrentHash() {
    var hash = String(window.location.hash || "#/").split("?")[0];
    if (hash === "" || hash === "#" || hash === "/") {
      return "#/";
    }
    return hash;
  }

  function ensureRoutePageTitles() {
    var hash = getCurrentHash();

    var studentListTitle = document.querySelector("#student_list .main-title");
    if (studentListTitle) {
      studentListTitle.textContent = "团队";
    }

    var newsListTitle = document.querySelector("#new_list #student > h2, #new_list h2");
    if (newsListTitle) {
      newsListTitle.textContent = "动态";
      newsListTitle.classList.add("route-page-title");
      newsListTitle.dataset.routeTitleKey = "news-list";
    }

    var newsDetailTitle = document.querySelector("#student_info .el-page-header__content");
    if (newsDetailTitle && String(newsDetailTitle.textContent || "").indexOf("详情") !== -1) {
      newsDetailTitle.textContent = "新闻详情";
    }

    if (hash === "#/achievement") {
      var achievementSection = document.querySelector(
        "#achievement_paper, #achievement_patent, #achievement_book, #achievement_copyright"
      );
      var achievementTabs = achievementSection ? achievementSection.closest(".el-tabs") : null;
      var achievementParent = achievementTabs
        ? achievementTabs.parentNode
        : (achievementSection ? achievementSection.parentNode : null);
      var achievementBeforeNode = achievementTabs || achievementSection;
      if (achievementParent) {
        upsertRouteTitle(achievementParent, achievementBeforeNode, "学术", "achievement");
      }
    }

    if (hash === "#/tool") {
      var toolSection = document.querySelector("#tool_fuzzer, #tool_vulDetector");
      var toolTabs = toolSection ? toolSection.closest(".el-tabs") : null;
      var toolParent = toolTabs ? toolTabs.parentNode : null;
      if (toolParent) {
        upsertRouteTitle(toolParent, toolTabs, "软件", "tool");
      }
    }
  }

  function normalizeTeamMentorSection() {
    var hash = getCurrentHash();
    if (hash.indexOf("#/studentList") !== 0) {
      return;
    }

    var container = document.querySelector("#student_list .student-container");
    if (!container) {
      return;
    }

    readCsv("data/teachers.csv").then(function (teachers) {
      var mentorList = (teachers || []).filter(isAlive).filter(function (teacher) {
        return String(teacher.name || "").trim() !== "";
      });

      if (!mentorList.length) {
        return;
      }

      var existing = container.querySelector("#team_mentor_section");
      if (existing && existing.dataset.teacherCount === String(mentorList.length)) {
        return;
      }
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      var mentorSection = document.createElement("div");
      mentorSection.className = "degree-section team-mentor-section";
      mentorSection.id = "team_mentor_section";
      mentorSection.dataset.teacherCount = String(mentorList.length);

      var mentorTitle = document.createElement("h2");
      mentorTitle.className = "degree-title";
      mentorTitle.textContent = "导师";

      var mentorListNode = document.createElement("ul");
      mentorListNode.className = "student-list mentor-list";

      mentorList.forEach(function (teacher, index) {
        var name = String(teacher.name || "").trim();
        if (!name) {
          return;
        }

        var item = document.createElement("li");
        item.className = "mentor-item";
        item.dataset.index = String(index);

        var link = document.createElement("a");
        link.className = "student-name mentor-name";
        link.href = "#/teacherInfo?name=" + encodeURIComponent(name);
        link.textContent = name;

        var title = String(teacher.title || "").trim();
        if (title) {
          var titleNode = document.createElement("span");
          titleNode.className = "mentor-title";
          titleNode.textContent = " · " + title;
          link.appendChild(titleNode);
        }

        item.appendChild(link);
        mentorListNode.appendChild(item);
      });

      mentorSection.appendChild(mentorTitle);
      mentorSection.appendChild(mentorListNode);

      var firstDegreeSection = container.querySelector(".degree-section");
      if (firstDegreeSection && firstDegreeSection.parentNode === container) {
        container.insertBefore(mentorSection, firstDegreeSection);
      } else {
        container.appendChild(mentorSection);
      }
    }).catch(function () {
      /* ignore mentor section enhancement errors */
    });
  }

  function applyAboutRouteMode() {
    var hash = getCurrentHash();
    var isAboutRoute = hash === "#/about";
    var isHomeRoute = hash === "#/" || hash === "" || hash === "/";

    if (document.body && document.body.classList) {
      document.body.classList.toggle("route-about", isAboutRoute);
      document.body.classList.toggle("route-home", isHomeRoute);
    }

    var sections = document.querySelectorAll ? document.querySelectorAll("#app .section") : [];
    Array.prototype.forEach.call(sections, function (section) {
      if (!section || !section.id) {
        return;
      }

      if (isAboutRoute) {
        if (section.id !== "Introduction") {
          if (section.dataset.aboutHiddenByRuntime !== "1") {
            section.dataset.aboutPrevDisplay = section.style.display || "";
          }
          section.style.display = "none";
          section.dataset.aboutHiddenByRuntime = "1";
        } else {
          section.style.display = "";
          section.dataset.aboutHiddenByRuntime = "";
        }
      } else if (section.dataset.aboutHiddenByRuntime === "1") {
        section.style.display = section.dataset.aboutPrevDisplay || "";
        section.dataset.aboutHiddenByRuntime = "";
        section.dataset.aboutPrevDisplay = "";
      }
    });
  }

  function normalizeAboutSectionHeading() {
    var hash = getCurrentHash();
    var isAboutRoute = hash === "#/about";
    var heading = document.querySelector("#Introduction .features-box > h2");

    if (!heading) {
      return;
    }

    if (isAboutRoute) {
      if (!heading.dataset.aboutPrevText) {
        heading.dataset.aboutPrevText = String(heading.textContent || "").trim() || "基本情况";
      }
      heading.textContent = "关于";
      return;
    }

    if (heading.dataset.aboutPrevText) {
      heading.textContent = heading.dataset.aboutPrevText;
    }
  }

  function normalizeHomeIntroductionSummary() {
    var hash = getCurrentHash();
    var isHomeRoute = hash === "#/" || hash === "" || hash === "/";

    var introSection = document.querySelector("#Introduction");
    if (!introSection) {
      return;
    }

    var box = introSection.querySelector(".features-box");
    if (!box) {
      return;
    }

    if (introOriginalHtml === null) {
      introOriginalHtml = box.innerHTML;
    }

    if (isHomeRoute) {
      if (box.dataset.homeSummaryApplied === "1") {
        return;
      }
      box.innerHTML = "";
      var paragraph = document.createElement("p");
      paragraph.className = "text-muted web-desc";
      paragraph.textContent = HOME_INTRO_SUMMARY;
      box.appendChild(paragraph);
      box.dataset.homeSummaryApplied = "1";
      return;
    }

    if (box.dataset.homeSummaryApplied === "1" && introOriginalHtml !== null) {
      box.innerHTML = introOriginalHtml;
      box.dataset.homeSummaryApplied = "";
    }
  }

  function syncNavActiveState() {
    var hash = getCurrentHash();

    var links = document.querySelectorAll ? document.querySelectorAll("#mySidenav a.nav-link") : [];
    Array.prototype.forEach.call(links, function (link) {
      var item = link && link.parentElement;
      if (item && item.classList) {
        item.classList.remove("active");
      }
    });

    var activeHref = null;
    if (hash === "#/" || hash === "/") {
      activeHref = "/";
    } else if (hash.indexOf("#/newList") === 0 || hash.indexOf("#/newInfo") === 0) {
      activeHref = "#/newList";
    } else if (hash.indexOf("#/achievement") === 0) {
      activeHref = "#/achievement";
    } else if (hash.indexOf("#/studentList") === 0 || hash.indexOf("#/studentInfo") === 0 || hash.indexOf("#/teacherInfo") === 0) {
      activeHref = "#/studentList";
    } else if (hash.indexOf("#/culture") === 0) {
      activeHref = "#/culture";
    } else if (hash.indexOf("#/tool") === 0) {
      activeHref = "#/tool";
    } else if (hash.indexOf("#/about") === 0) {
      activeHref = "#/about";
    }

    if (!activeHref) {
      return;
    }

    Array.prototype.forEach.call(links, function (link) {
      var href = String(link.getAttribute("href") || "").trim();
      var matched = href === activeHref;
      if (!matched && activeHref === "/" && href === "#/") {
        matched = true;
      }
      if (matched && link.parentElement && link.parentElement.classList) {
        link.parentElement.classList.add("active");
      }
    });
  }

  function normalizeHomeSectionTitles() {
    var hash = getCurrentHash();
    if (hash !== "#/") {
      return;
    }

    var newsTitle = document.querySelector("#news .section-title");
    if (newsTitle) {
      newsTitle.textContent = "动态";
    }

    var teacherTitle = document.querySelector("#teacher .section-title");
    if (teacherTitle) {
      teacherTitle.textContent = "团队";
    }

    var projectTitle = document.querySelector("#project .section-title");
    if (projectTitle) {
      projectTitle.textContent = "科研项目";
    }
  }

  function runLayoutEnhancements(root) {
    var scope = normalizeScopeRoot(root);
    optimizeImages(scope);
    optimizeCultureRouteImages(scope);
    optimizeFooterContactLayout(scope);
  }

  function runStructuralEnhancements() {
    optimizeFooterBranding();
    optimizeNavbarBrand();
    ensureAboutNavLink(document);
    normalizeNavLabels(document);
    ensureRoutePageTitles();
    normalizeTeamMentorSection();
    normalizeHomeSectionTitles();
    applyAboutRouteMode();
    normalizeAboutSectionHeading();
    normalizeHomeIntroductionSummary();
    syncNavActiveState();
  }

  function runAllEnhancements(root) {
    runLayoutEnhancements(root);
    runStructuralEnhancements();
  }

  function mergeScheduledRoot(nextRoot) {
    var next = normalizeScopeRoot(nextRoot);
    var current = enhancementScheduledRoot;

    if (!current || current === document) {
      enhancementScheduledRoot = next;
      return;
    }

    if (next === document) {
      enhancementScheduledRoot = document;
      return;
    }

    if (current.contains && current.contains(next)) {
      return;
    }

    if (next.contains && next.contains(current)) {
      enhancementScheduledRoot = next;
      return;
    }

    enhancementScheduledRoot = document;
  }

  function scheduleEnhancements(root) {
    mergeScheduledRoot(root);

    if (enhancementQueuePending) {
      return;
    }

    enhancementQueuePending = true;
    var runner = function () {
      enhancementQueuePending = false;
      var scheduledRoot = enhancementScheduledRoot || document;
      enhancementScheduledRoot = null;
      runAllEnhancements(scheduledRoot);
    };

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(runner);
    } else {
      window.setTimeout(runner, 16);
    }
  }

  function isMutationNodeRelevant(node) {
    if (!isElementNode(node)) {
      return false;
    }
    var tag = node.tagName ? node.tagName.toLowerCase() : "";
    return tag !== "script" && tag !== "style" && tag !== "link" && tag !== "meta";
  }

  function detectMutationRoot(mutations) {
    var root = null;
    var hasRelevantMutation = false;

    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        if (!isMutationNodeRelevant(node)) {
          return;
        }

        hasRelevantMutation = true;
        var nodeRoot = node;
        if (node.tagName && node.tagName.toLowerCase() === "img") {
          nodeRoot = node.parentNode || node;
        }

        if (!root) {
          root = nodeRoot;
          return;
        }

        if (root === document || nodeRoot === document) {
          root = document;
          return;
        }

        if (root.contains && root.contains(nodeRoot)) {
          return;
        }

        if (nodeRoot.contains && nodeRoot.contains(root)) {
          root = nodeRoot;
          return;
        }

        root = document;
      });
    });

    if (!hasRelevantMutation) {
      return null;
    }

    return root || document;
  }

  function bootEnhancements() {
    runAllEnhancements(document);
    scheduleEnhancements(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootEnhancements);
  } else {
    bootEnhancements();
  }

  window.addEventListener("load", function () {
    scheduleEnhancements(document);
  });

  window.addEventListener("hashchange", function () {
    scheduleEnhancements(document);
  });

  window.addEventListener("resize", function () {
    if (resizeDebounceTimer !== null) {
      window.clearTimeout(resizeDebounceTimer);
    }
    resizeDebounceTimer = window.setTimeout(function () {
      resizeDebounceTimer = null;
      scheduleEnhancements(document);
    }, 140);
  });

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      var mutationRoot = detectMutationRoot(mutations);
      if (mutationRoot) {
        scheduleEnhancements(mutationRoot);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
