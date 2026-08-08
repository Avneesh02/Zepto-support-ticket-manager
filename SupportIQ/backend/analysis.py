"""
Quick dataset inspection utility.

Run standalone:
    python analysis.py

Generates summary statistics and charts in:
    analysis_output/
"""

from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "analysis_output"

OUTPUT_DIR.mkdir(exist_ok=True)


def load_data():
    resolved = pd.read_csv(DATA_DIR / "resolved_tickets.CSV")
    new = pd.read_csv(DATA_DIR / "new_tickets.CSV")
    orders = pd.read_csv(DATA_DIR / "orders_context.CSV")

    return resolved, new, orders


def save_chart(filename):
    plt.tight_layout()
    plt.savefig(
        OUTPUT_DIR / filename,
        dpi=150,
        bbox_inches="tight"
    )
    plt.close()

    print(f"Chart saved: {filename}")


def create_visualizations(resolved, new, orders):

    # ---------------------------------------------------------
    # 1. Category Distribution
    # ---------------------------------------------------------

    category_counts = resolved["category"].value_counts()

    plt.figure(figsize=(9, 5))
    category_counts.plot(
        kind="bar",
        edgecolor="black"
    )

    plt.title("Resolved Tickets by Category")
    plt.xlabel("Category")
    plt.ylabel("Number of Tickets")
    plt.xticks(rotation=25, ha="right")

    save_chart("category_distribution.png")


    # ---------------------------------------------------------
    # 2. Resolution Action Distribution
    # ---------------------------------------------------------

    action_counts = resolved["resolution_action"].value_counts()

    plt.figure(figsize=(10, 5))
    action_counts.plot(
        kind="bar",
        edgecolor="black"
    )

    plt.title("Resolution Action Distribution")
    plt.xlabel("Resolution Action")
    plt.ylabel("Number of Tickets")
    plt.xticks(rotation=25, ha="right")

    save_chart("resolution_action_distribution.png")


    # ---------------------------------------------------------
    # 3. Action by Category
    # ---------------------------------------------------------

    action_category = pd.crosstab(
        resolved["category"],
        resolved["resolution_action"]
    )

    ax = action_category.plot(
        kind="bar",
        stacked=True,
        figsize=(11, 6)
    )

    ax.set_title("Resolution Actions by Category")
    ax.set_xlabel("Category")
    ax.set_ylabel("Number of Tickets")
    plt.xticks(rotation=25, ha="right")
    plt.legend(
        title="Resolution Action",
        bbox_to_anchor=(1.02, 1),
        loc="upper left"
    )

    save_chart("action_by_category.png")


    # ---------------------------------------------------------
    # 4. Order Delivery Status
    # ---------------------------------------------------------

    status_counts = orders["delivery_status"].value_counts()

    plt.figure(figsize=(7, 5))

    plt.pie(
        status_counts.values,
        labels=status_counts.index,
        autopct="%1.1f%%",
        startangle=90
    )

    plt.title("Order Delivery Status")

    save_chart("order_delivery_status.png")


    # ---------------------------------------------------------
    # 5. Average CSAT by Resolution Action
    # ---------------------------------------------------------

    avg_csat = (
        resolved
        .groupby("resolution_action")["csat"]
        .mean()
        .sort_values(ascending=False)
    )

    plt.figure(figsize=(10, 5))

    avg_csat.plot(
        kind="bar",
        edgecolor="black"
    )

    plt.title("Average CSAT by Resolution Action")
    plt.xlabel("Resolution Action")
    plt.ylabel("Average CSAT")
    plt.ylim(0, 5.5)
    plt.xticks(rotation=25, ha="right")

    # Display values above bars
    for i, value in enumerate(avg_csat):
        plt.text(
            i,
            value + 0.08,
            f"{value:.2f}",
            ha="center",
            fontsize=9
        )

    save_chart("average_csat_by_action.png")


def main():

    print("=" * 60)
    print("SUPPORTIQ DATASET ANALYSIS")
    print("=" * 60)

    resolved, new, orders = load_data()

    # ---------------------------------------------------------
    # Dataset overview
    # ---------------------------------------------------------

    print("\nDATASET OVERVIEW")
    print("-" * 60)

    print(
        f"Resolved tickets : {len(resolved)}"
    )

    print(
        f"New tickets      : {len(new)}"
    )

    print(
        f"Orders           : {len(orders)}"
    )

    # ---------------------------------------------------------
    # Missing values
    # ---------------------------------------------------------

    print("\nMISSING VALUES")
    print("-" * 60)

    print(
        f"Resolved tickets : {resolved.isna().sum().sum()}"
    )

    print(
        f"New tickets      : {new.isna().sum().sum()}"
    )

    print(
        f"Orders           : {orders.isna().sum().sum()}"
    )

    # ---------------------------------------------------------
    # Categories
    # ---------------------------------------------------------

    print("\nCATEGORY DISTRIBUTION")
    print("-" * 60)

    print(
        resolved["category"].value_counts()
    )

    # ---------------------------------------------------------
    # Resolution actions
    # ---------------------------------------------------------

    print("\nRESOLUTION ACTION DISTRIBUTION")
    print("-" * 60)

    print(
        resolved["resolution_action"].value_counts()
    )

    # ---------------------------------------------------------
    # Action by category
    # ---------------------------------------------------------

    print("\nACTION BREAKDOWN BY CATEGORY")
    print("-" * 60)

    print(
        resolved
        .groupby("category")["resolution_action"]
        .value_counts()
    )

    # ---------------------------------------------------------
    # Order status
    # ---------------------------------------------------------

    print("\nORDER DELIVERY STATUS")
    print("-" * 60)

    print(
        orders["delivery_status"].value_counts()
    )

    # ---------------------------------------------------------
    # Average CSAT
    # ---------------------------------------------------------

    print("\nAVERAGE CSAT BY ACTION")
    print("-" * 60)

    print(
        resolved
        .groupby("resolution_action")["csat"]
        .mean()
        .round(2)
        .sort_values(ascending=False)
    )

    # ---------------------------------------------------------
    # Time to resolve
    # ---------------------------------------------------------

    print("\nTIME TO RESOLVE")
    print("-" * 60)

    print(
        resolved["time_to_resolve_min"]
        .describe()
        .round(2)
    )

    # ---------------------------------------------------------
    # Generate charts
    # ---------------------------------------------------------

    print("\nGENERATING VISUALIZATIONS")
    print("-" * 60)

    create_visualizations(
        resolved,
        new,
        orders
    )

    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)

    print(
        f"\nCharts saved in:\n{OUTPUT_DIR}"
    )


if __name__ == "__main__":
    main()