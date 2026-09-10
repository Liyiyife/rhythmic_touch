library(ordinal)

ratings <- read.csv("likert_ratings.csv")

ratings$user_id <- factor(ratings$user_id)
ratings$rating <- ordered(ratings$rating)

complexity_ease <- subset(
  ratings,
  iv == "rhythmic_complexity" &
  rating_type == "ease"
)

complexity_ease$condition <- factor(
  complexity_ease$condition,
  levels = c("simple", "complex")
)

model_complexity <- clmm(
  rating ~ condition + (1 | user_id),
  data = complexity_ease
)

summary(model_complexity)

action_ease <- subset(
  ratings,
  iv == "input_action_type" &
  rating_type == "ease"
)

action_ease$condition <- factor(
  action_ease$condition,
  levels = c(
    "tap-only",
    "tap-and-swipe"
  )
)

model_action <- clmm(
  rating ~ condition + (1 | user_id),
  data = action_ease
)

summary(model_action)

feedback_ease <- subset(
  ratings,
  iv == "feedback_modality" &
  rating_type == "ease"
)

feedback_ease$condition <- factor(
  feedback_ease$condition,
  levels = c(
    "none",
    "visual",
    "audio",
    "haptic"
  )
)

model_feedback_ease <- clmm(
  rating ~ condition + (1 | user_id),
  data = feedback_ease
)

summary(model_feedback_ease)

feedback_confidence <- subset(
  ratings,
  iv == "feedback_modality" &
  rating_type == "recognition_confidence"
)

feedback_confidence$condition <- factor(
  feedback_confidence$condition,
  levels = c(
    "none",
    "visual",
    "audio",
    "haptic"
  )
)

model_feedback_confidence <- clmm(
  rating ~ condition + (1 | user_id),
  data = feedback_confidence
)

summary(model_feedback_confidence)

feedback_helpfulness <- subset(
  ratings,
  iv == "feedback_modality" &
  rating_type == "feedback_helpfulness"
)

feedback_helpfulness$condition <- factor(
  feedback_helpfulness$condition,
  levels = c(
    "visual",
    "audio",
    "haptic"
  )
)

model_feedback_helpfulness <- clmm(
  rating ~ condition + (1 | user_id),
  data = feedback_helpfulness
)

summary(model_feedback_helpfulness)
