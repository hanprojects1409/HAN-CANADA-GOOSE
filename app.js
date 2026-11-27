
import {
  db,
  ref,
  onValue,
  recordPostInteraction
} from "./firebase.js";


const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalPlatform = document.getElementById("modal-platform");
const modalDescription = document.getElementById("modal-description");
const openPostBtn = document.getElementById("open-post-btn");
const closeModal = document.getElementById("close-modal");

const commentModal = document.getElementById("comment-modal");
const closeCommentModal = document.getElementById("close-comment-modal");

const pickCommentBtn = document.getElementById("pick-comment-btn");
const copyCommentBtn = document.getElementById("copy-comment-btn");
const generatedComment = document.getElementById("generated-comment");
const languageSelect = document.getElementById("comment-language");
const openInstagramBtn = document.getElementById("open-instagram-btn");

const copyHashtagsBtn = document.getElementById("copy-hashtags-btn");
const hashtagsContainer = document.getElementById("hashtags");

const container = document.getElementById("posts-container");
const markCompletedBtn = document.getElementById("mark-completed-btn");
const postInstructions = document.getElementById(
  "post-instructions"
);


const categories = [
  "han",
  "instagram",
  "twitter",
  "tiktok",
  "naver"
];

const categoryLabels = {
  han: "HAN (@_doolsetnet)",
  instagram: "Instagram",
  twitter: "Twitter / X",
  tiktok: "TikTok",
  naver: "Naver Articles"
};

const fixedHashtags = [
  "#HANxCanadaGoose",
  "#한지성_캐나다구스"
];

let currentPost = null;

const globalStats = {};

// Prevent accidental repeated clicks during this page session.
// No user identity or personal interaction history is stored.
const completedThisSession = new Set();


function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function getPostCategory(post) {
  const value = String(
    post.category || post.platform || ""
  ).toLowerCase();

  if (value.includes("naver")) {
    return "naver";
  }

  if (
    value.includes("instagram") ||
    value === "ig"
  ) {
    return "instagram";
  }

  if (
    value.includes("twitter") ||
    value.includes("x.com") ||
    value === "x"
  ) {
    return "twitter";
  }

  if (value.includes("tiktok")) {
    return "tiktok";
  }

  return "han";
}

function getPostTitle(post) {
  return post.title || post.id;
}

function getPostDescription(post) {
  return post.description || post.caption || "";
}

function getPostLink(post) {
  return post.link || post.url || "";
}

function openExternalLink(url) {
  if (!url) return;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}



if (hashtagsContainer) {
  hashtagsContainer.innerHTML = fixedHashtags
    .map(tag => `<span>${tag}</span>`)
    .join("");
}

if (copyHashtagsBtn) {
  copyHashtagsBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        fixedHashtags.join(" ")
      );

      copyHashtagsBtn.textContent = "Hashtags copied";

      setTimeout(() => {
        copyHashtagsBtn.textContent = "Copy hashtags";
      }, 1500);

    } catch (error) {
      console.error("Error copying hashtags:", error);
    }
  });
}

async function loadPostThumbnail(post, image, fallback) {
  const link = getPostLink(post);

  if (!link || post.image) return;

  try {
    const response = await fetch(
      `/preview?url=${encodeURIComponent(link)}`
    );

    if (!response.ok) throw new Error("Preview unavailable");

    const data = await response.json();

    if (!data.image) throw new Error("No preview image");

    image.src = data.image;

  } catch (error) {
    image.remove();
    fallback.style.display = "flex";
  }
}

function createPostCard(post) {
  const card = document.createElement("article");

  card.classList.add("post-card");
  card.dataset.category = getPostCategory(post);
  card.dataset.postId = post.id;

card.innerHTML = `
  <div class="post-thumbnail">

    <img
      src="${post.image ? escapeHTML(post.image) : ""}"
      alt="${escapeHTML(getPostTitle(post))}"
      loading="lazy"
      ${post.image ? "" : "hidden"}
    >

    <div class="post-thumbnail-fallback">
      IMAGE UNAVAILABLE
    </div>

  </div>

  <div class="post-info">

    <h3>${escapeHTML(getPostTitle(post))}</h3>

    <p>${escapeHTML(categoryLabels[getPostCategory(post)])}</p>

    <div class="post-stats">
      <span class="interaction-label">Interactions</span>

      <strong id="interactions-${escapeHTML(post.id)}">0</strong>

      <div
        class="engagement-badge"
        id="badge-${escapeHTML(post.id)}">
        Needs more interactions
      </div>
    </div>

  </div>
`;
  
  const thumbnail = card.querySelector(".post-thumbnail");
const image = thumbnail.querySelector("img");
const fallback = thumbnail.querySelector(
  ".post-thumbnail-fallback"
);

if (post.image) {
  image.addEventListener("error", () => {
    image.remove();
    fallback.style.display = "flex";
  }, { once: true });
} else {
  loadPostThumbnail(post, image, fallback);
}

  card.addEventListener("click", () => {
    openModal(post);
  });

  container.appendChild(card);

  watchPostStats(post);
}



if (
  Array.isArray(window.posts) &&
  container
) {
  container.innerHTML = "";

  window.posts.forEach(createPostCard);
}



document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.filter;

    document.querySelectorAll(".tab-btn").forEach(tab => {
      tab.classList.remove("active");
    });

    button.classList.add("active");

    document.querySelectorAll(".post-card").forEach(card => {
      card.hidden =
        card.dataset.category !== selectedCategory;
    });
  });
});



function openModal(post) {
  currentPost = post;

  const category = getPostCategory(post);
  const isNaver = category === "naver";
  const alreadyCompleted = completedThisSession.has(post.id);

  if (modalTitle) {
    modalTitle.textContent = getPostTitle(post);
  }

  if (modalPlatform) {
    modalPlatform.textContent = categoryLabels[category];
  }

  if (modalDescription) {
    modalDescription.textContent =
      getPostDescription(post);
  }

  // Adapt modal according to post type

  if (postInstructions) {
    postInstructions.hidden = isNaver;
  }

  if (openCommentBtn) {
    openCommentBtn.hidden = isNaver;
  }

  if (openPostBtn) {
    openPostBtn.textContent = isNaver
      ? "OPEN ARTICLE"
      : "OPEN POST";

    openPostBtn.onclick = () => {
      openExternalLink(getPostLink(post));
    };
  }

  if (openInstagramBtn) {
    openInstagramBtn.onclick = () => {
      openExternalLink(getPostLink(post));
    };
  }

  if (markCompletedBtn) {
    markCompletedBtn.disabled = alreadyCompleted;

    markCompletedBtn.textContent = alreadyCompleted
      ? (isNaver ? "Article completed" : "Interaction recorded")
      : "Mark as completed";
  }

  if (modal) {
    modal.classList.add("active");
  }
}


if (markCompletedBtn) {
  markCompletedBtn.addEventListener("click", async () => {
    if (!currentPost) return;

    if (completedThisSession.has(currentPost.id)) {
      return;
    }

    const postId = currentPost.id;

    markCompletedBtn.disabled = true;
    markCompletedBtn.textContent = "Recording...";

    try {
      await recordPostInteraction(postId);

      completedThisSession.add(postId);

      markCompletedBtn.textContent =
  getPostCategory(currentPost) === "naver"
    ? "Article completed"
    : "Interaction recorded";

    } catch (error) {
      console.error(
        "Error recording interaction:",
        error
      );

      markCompletedBtn.disabled = false;
      markCompletedBtn.textContent =
        "Try again";

    }
  });
}


const openCommentBtn = document.createElement("button");

openCommentBtn.type = "button";
openCommentBtn.id = "open-comment-generator-btn";
openCommentBtn.textContent = "OPEN COMMENT GENERATOR";

if (modalDescription) {
    modalDescription.after(openCommentBtn);
}

openCommentBtn.addEventListener("click", () => {
    commentModal?.classList.add("active");
});



if (closeModal) {
  closeModal.addEventListener("click", () => {
    modal?.classList.remove("active");
  });
}

if (closeCommentModal) {
  closeCommentModal.addEventListener("click", () => {
    commentModal?.classList.remove("active");
  });
}



if (pickCommentBtn) {
  pickCommentBtn.addEventListener("click", () => {
    if (!languageSelect || !generatedComment) {
      return;
    }

    const language = languageSelect.value;
    const comments = window.comments?.[language];

    if (!comments || comments.length === 0) {
      generatedComment.textContent =
        "No comments available for this language.";
      return;
    }

    const randomIndex = Math.floor(
      Math.random() * comments.length
    );

    generatedComment.textContent =
      comments[randomIndex];
  });
}



if (copyCommentBtn) {
  copyCommentBtn.addEventListener("click", async () => {
    if (!generatedComment) return;

    const text = generatedComment.textContent.trim();

    if (
      !text ||
      text === "Generate a comment" ||
      text === "No comments available for this language."
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      copyCommentBtn.textContent = "Copied!";

      setTimeout(() => {
        copyCommentBtn.textContent = "Copy comment";
      }, 1500);

    } catch (error) {
      console.error("Error copying comment:", error);
    }
  });
}



function watchPostStats(post) {
  const postRef = ref(
    db,
    `postInteractions/${post.id}`
  );

  onValue(
    postRef,
    snapshot => {
      const value = snapshot.val();

      const total = Math.max(
        0,
        Number(value || 0)
      );

      globalStats[post.id] = {
        total,
        category: getPostCategory(post)
      };

      const counter = document.getElementById(
        `interactions-${post.id}`
      );

      if (counter) {
        counter.textContent = total;
      }

      const badge = document.getElementById(
        `badge-${post.id}`
      );

      if (badge) {
        badge.textContent =
          total >= 50
            ? "Good progress"
            : "Needs more interactions";
      }

      updateOverview();
    },
    error => {
      console.error(
        `Error reading interactions for ${post.id}:`,
        error
      );
    }
  );
}



function updateOverview() {
  const posts = Array.isArray(window.posts)
    ? window.posts
    : [];

  const totalPosts = posts.length;

  let totalInteractions = 0;

  const categoryStats = {
    han: { posts: 0, activePosts: 0, interactions: 0 },
    instagram: { posts: 0, activePosts: 0, interactions: 0 },
    twitter: { posts: 0, activePosts: 0, interactions: 0 },
    tiktok: { posts: 0, activePosts: 0, interactions: 0 },
    naver: { posts: 0, activePosts: 0, interactions: 0 }
};

  posts.forEach(post => {
    const category = getPostCategory(post);
    const stats = globalStats[post.id];

    categoryStats[category].posts++;

    if (stats) {
      categoryStats[category].interactions += stats.total;
      totalInteractions += stats.total;

      if (stats.total > 0) {
        categoryStats[category].activePosts++;
      }
    }
  });

  const totalPostsElement = document.getElementById(
    "overview-total-posts"
  );

  const completedElement = document.getElementById(
    "overview-completed"
  );

  if (totalPostsElement) {
    totalPostsElement.textContent = totalPosts;
  }

  if (completedElement) {
    completedElement.textContent = totalInteractions;
  }

  categories.forEach(category => {
    const stats = categoryStats[category];

    const counter = document.getElementById(
      `overview-${category}`
    );

    const status = document.getElementById(
      `status-${category}`
    );

    if (counter) {
      counter.textContent =
        `${stats.interactions} interactions`;
    }

    if (status) {
      const progress = stats.posts > 0
        ? (stats.activePosts / stats.posts) * 100
        : 0;

      status.textContent =
        progress >= 50
          ? "Good progress"
          : "Needs more interactions";
    }
  });
}

updateOverview();
