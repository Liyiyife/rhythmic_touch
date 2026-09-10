import json
import numpy as np
import pandas as pd

from scipy.stats import (
    ttest_rel,
    wilcoxon,
    friedmanchisquare
)

from statsmodels.stats.anova import AnovaRM
from statsmodels.stats.contingency_tables import (
    cochrans_q,
    mcnemar
)

FILE_PATH = "rhythmic_touchscreen_dataset.xlsx"

trials = pd.read_excel(FILE_PATH, sheet_name="Trials")
attempts = pd.read_excel(FILE_PATH, sheet_name="Attempts")
surveys = pd.read_excel(FILE_PATH, sheet_name="Surveys")

time_columns_trials = [
    "trial_start_time",
    "trial_end_time"
]

time_columns_attempts = [
    "preview_end_time",
    "attempt_start_time",
    "attempt_end_time"
]

for column in time_columns_trials:
    trials[column] = pd.to_numeric(
        trials[column],
        errors="coerce"
    )

for column in time_columns_attempts:
    attempts[column] = pd.to_numeric(
        attempts[column],
        errors="coerce"
    )

attempts["similarity_score"] = pd.to_numeric(
    attempts["similarity_score"],
    errors="coerce"
)

attempts["attempt_number"] = pd.to_numeric(
    attempts["attempt_number"],
    errors="coerce"
)

final_attempts = (
    attempts
    .sort_values(
        ["trial_id", "attempt_number"]
    )
    .groupby("trial_id", as_index=False)
    .tail(1)
)

attempt_count = (
    attempts
    .groupby("trial_id")
    .size()
    .reset_index(name="attempts")
)

final_attempts = final_attempts[
    [
        "trial_id",
        "similarity_score",
        "overall_action_correct",
        "preview_end_time",
        "attempt_start_time",
        "attempt_end_time"
    ]
]

trial_data = trials.merge(
    final_attempts,
    on="trial_id",
    how="left"
)

trial_data = trial_data.merge(
    attempt_count,
    on="trial_id",
    how="left"
)

trial_data["preparation_time"] = (
    trial_data["attempt_start_time"]
    - trial_data["preview_end_time"]
) / 1000

trial_data["task_time"] = (
    trial_data["trial_end_time"]
    - trial_data["trial_start_time"]
) / 1000

trial_data["task_success"] = (
    trial_data["task_success"]
    .astype(str)
    .str.lower()
    .map({
        "true": 1,
        "false": 0
    })
)

trial_data["overall_action_correct"] = (
    trial_data["overall_action_correct"]
    .astype(str)
    .str.lower()
    .map({
        "true": 1,
        "false": 0
    })
)

def descriptive_statistics(data, condition_column, measure):
    result = (
        data
        .groupby(condition_column)[measure]
        .agg(
            mean="mean",
            std="std",
            median="median",
            minimum="min",
            maximum="max"
        )
    )

    print("\n", measure)
    print(result.round(2))

def paired_t_test(
    data,
    condition_column,
    measure,
    condition_1,
    condition_2
):
    wide = data.pivot(
        index="user_id",
        columns=condition_column,
        values=measure
    ).dropna()

    result = ttest_rel(
        wide[condition_1],
        wide[condition_2]
    )

    print("\nPaired t-test:", measure)
    print("t =", round(result.statistic, 3))
    print("p =", round(result.pvalue, 4))

    return result

def paired_wilcoxon(
    data,
    condition_column,
    measure,
    condition_1,
    condition_2
):
    wide = data.pivot(
        index="user_id",
        columns=condition_column,
        values=measure
    ).dropna()

    result = wilcoxon(
        wide[condition_1],
        wide[condition_2]
    )

    print("\nWilcoxon test:", measure)
    print("W =", round(result.statistic, 3))
    print("p =", round(result.pvalue, 4))

    return result

def repeated_measures_anova(
    data,
    measure,
    condition_column
):
    model = AnovaRM(
        data=data,
        depvar=measure,
        subject="user_id",
        within=[condition_column]
    ).fit()

    print("\nRepeated-measures ANOVA:", measure)
    print(model)

    return model

def friedman_test(
    data,
    condition_column,
    measure,
    condition_order
):
    wide = data.pivot(
        index="user_id",
        columns=condition_column,
        values=measure
    ).dropna()

    groups = [
        wide[condition]
        for condition in condition_order
    ]

    result = friedmanchisquare(*groups)

    print("\nFriedman test:", measure)
    print("Chi-square =", round(result.statistic, 3))
    print("p =", round(result.pvalue, 4))

    return result

complexity_patterns = [
    "S",
    "C1",
    "C2",
    "C3",
    "C4"
]

complexity = trial_data[
    trial_data["pattern_id"].isin(
        complexity_patterns
    )
].copy()

complexity["condition"] = np.where(
    complexity["pattern_id"] == "S",
    "Simple",
    "Complex"
)

complexity_summary = (
    complexity
    .groupby(
        ["user_id", "condition"],
        as_index=False
    )
    .agg(
        similarity=("similarity_score", "mean"),
        task_time=("task_time", "mean"),
        preparation_time=("preparation_time", "mean"),
        attempts=("attempts", "mean"),
        task_success=("task_success", "mean"),
        action_correctness=(
            "overall_action_correct",
            "mean"
        )
    )
)

for measure in [
    "similarity",
    "task_time",
    "preparation_time",
    "attempts"
]:
    descriptive_statistics(
        complexity_summary,
        "condition",
        measure
    )

paired_t_test(
    complexity_summary,
    "condition",
    "similarity",
    "Simple",
    "Complex"
)

paired_t_test(
    complexity_summary,
    "condition",
    "task_time",
    "Simple",
    "Complex"
)

paired_t_test(
    complexity_summary,
    "condition",
    "preparation_time",
    "Simple",
    "Complex"
)

paired_wilcoxon(
    complexity_summary,
    "condition",
    "attempts",
    "Simple",
    "Complex"
)

complexity_success = complexity_summary.pivot(
    index="user_id",
    columns="condition",
    values="task_success"
)

complexity_success = (
    complexity_success >= 1
).astype(int)

table = pd.crosstab(
    complexity_success["Simple"],
    complexity_success["Complex"]
)

if table.shape == (2, 2):
    result = mcnemar(
        table,
        exact=True
    )

    print("\nMcNemar test: task success")
    print("Statistic =", result.statistic)
    print("p =", result.pvalue)
else:
    print(
        "\nMcNemar test not performed: "
        "no variation in task success."
    )

feedback_pattern_map = {
    "FM_NONE": "No Feedback",
    "FM_VISUAL": "Visual",
    "FM_AUDIO": "Audio",
    "FM_HAPTIC": "Haptic"
}

feedback = trial_data[
    trial_data["pattern_id"].isin(
        feedback_pattern_map.keys()
    )
].copy()

feedback["condition"] = feedback[
    "pattern_id"
].map(feedback_pattern_map)

feedback_order = [
    "No Feedback",
    "Visual",
    "Audio",
    "Haptic"
]

feedback_summary = (
    feedback
    .groupby(
        ["user_id", "condition"],
        as_index=False
    )
    .agg(
        similarity=("similarity_score", "mean"),
        task_time=("task_time", "mean"),
        preparation_time=("preparation_time", "mean"),
        attempts=("attempts", "mean"),
        task_success=("task_success", "mean"),
        action_correctness=(
            "overall_action_correct",
            "mean"
        )
    )
)

for measure in [
    "similarity",
    "task_time",
    "preparation_time",
    "attempts"
]:
    descriptive_statistics(
        feedback_summary,
        "condition",
        measure
    )

repeated_measures_anova(
    feedback_summary,
    "similarity",
    "condition"
)

repeated_measures_anova(
    feedback_summary,
    "task_time",
    "condition"
)

repeated_measures_anova(
    feedback_summary,
    "preparation_time",
    "condition"
)

friedman_test(
    feedback_summary,
    "condition",
    "attempts",
    feedback_order
)

feedback_success = feedback_summary.pivot(
    index="user_id",
    columns="condition",
    values="task_success"
)

feedback_success = (
    feedback_success[feedback_order] >= 1
).astype(int)

cochran_result = cochrans_q(
    feedback_success.to_numpy()
)

print("\nCochran's Q test: task success")
print(
    "Q =",
    round(cochran_result.statistic, 3)
)
print(
    "p =",
    round(cochran_result.pvalue, 4)
)

action_patterns = [
    "T1",
    "M1",
    "M2",
    "M3",
    "M4"
]

action = trial_data[
    trial_data["pattern_id"].isin(
        action_patterns
    )
].copy()

action["condition"] = np.where(
    action["pattern_id"] == "T1",
    "Tap-only",
    "Tap-and-swipe"
)

action_summary = (
    action
    .groupby(
        ["user_id", "condition"],
        as_index=False
    )
    .agg(
        similarity=("similarity_score", "mean"),
        task_time=("task_time", "mean"),
        preparation_time=("preparation_time", "mean"),
        attempts=("attempts", "mean"),
        task_success=("task_success", "mean"),
        action_correctness=(
            "overall_action_correct",
            "mean"
        )
    )
)

for measure in [
    "similarity",
    "task_time",
    "preparation_time",
    "attempts",
    "action_correctness"
]:
    descriptive_statistics(
        action_summary,
        "condition",
        measure
    )

paired_t_test(
    action_summary,
    "condition",
    "similarity",
    "Tap-only",
    "Tap-and-swipe"
)

paired_t_test(
    action_summary,
    "condition",
    "task_time",
    "Tap-only",
    "Tap-and-swipe"
)

paired_t_test(
    action_summary,
    "condition",
    "preparation_time",
    "Tap-only",
    "Tap-and-swipe"
)

paired_wilcoxon(
    action_summary,
    "condition",
    "attempts",
    "Tap-only",
    "Tap-and-swipe"
)

action_correct = action_summary.pivot(
    index="user_id",
    columns="condition",
    values="action_correctness"
)

action_correct = (
    action_correct >= 1
).astype(int)

table = pd.crosstab(
    action_correct["Tap-only"],
    action_correct["Tap-and-swipe"]
)

if table.shape == (2, 2):
    result = mcnemar(
        table,
        exact=True
    )

    print("\nMcNemar test: action correctness")
    print("Statistic =", result.statistic)
    print("p =", result.pvalue)
else:
    print(
        "\nMcNemar test not performed: "
        "no variation in action correctness."
    )

def load_json(value):
    if pd.isna(value):
        return {}

    if isinstance(value, dict):
        return value

    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}

surveys["response_json"] = surveys[
    "responses"
].apply(load_json)

rating_rows = []

for _, row in surveys.iterrows():

    if row["survey_type"] != "SUB_BLOCK_RATING":
        continue

    response = row["response_json"]

    iv = response.get("iv")
    level = response.get("level_value")
    ratings = response.get("ratings", {})

    for rating_name, rating_value in ratings.items():

        rating_rows.append(
            {
                "user_id": row["user_id"],
                "iv": iv,
                "condition": level,
                "rating_type": rating_name,
                "rating": rating_value
            }
        )

ratings = pd.DataFrame(rating_rows)

ratings["rating"] = pd.to_numeric(
    ratings["rating"],
    errors="coerce"
)

ratings.to_csv(
    "likert_ratings.csv",
    index=False
)

def identify_block(pattern_id):

    if pattern_id in [
        "S",
        "C1",
        "C2",
        "C3",
        "C4"
    ]:
        return "Rhythmic Complexity"

    if pattern_id in [
        "T1",
        "M1",
        "M2",
        "M3",
        "M4"
    ]:
        return "Input Action Type"

    if pattern_id in [
        "FM_NONE",
        "FM_VISUAL",
        "FM_AUDIO",
        "FM_HAPTIC"
    ]:
        return "Feedback Modality"

    return np.nan

trial_data["experimental_factor"] = (
    trial_data["pattern_id"]
    .apply(identify_block)
)

block_map = (
    trial_data
    .dropna(
        subset=["experimental_factor"]
    )
    .groupby(
        ["user_id", "block_id"],
        as_index=False
    )
    .agg(
        experimental_factor=(
            "experimental_factor",
            "first"
        )
    )
)

nasa_rows = []

for _, row in surveys.iterrows():

    if row["survey_type"] != "NASA_TLX":
        continue

    response = row["response_json"]

    values = [
        response.get("mental_demand"),
        response.get("physical_demand"),
        response.get("temporal_demand"),
        response.get("perceived_performance"),
        response.get("effort"),
        response.get("frustration")
    ]

    values = [
        float(value)
        for value in values
        if value is not None
    ]

    if len(values) == 6:

        nasa_rows.append(
            {
                "user_id": row["user_id"],
                "block_id": row["block_id"],
                "nasa_tlx": np.mean(values)
            }
        )

nasa = pd.DataFrame(nasa_rows)

nasa = nasa.merge(
    block_map,
    on=[
        "user_id",
        "block_id"
    ],
    how="left"
)

print("\nNASA-TLX descriptive statistics")

print(
    nasa
    .groupby("experimental_factor")["nasa_tlx"]
    .agg(
        ["mean", "std", "median"]
    )
    .round(2)
)

nasa_anova = AnovaRM(
    data=nasa,
    depvar="nasa_tlx",
    subject="user_id",
    within=["experimental_factor"]
).fit()

print("\nNASA-TLX repeated-measures ANOVA")
print(nasa_anova)
