import json
import random
from pathlib import Path
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "data" / "quotes.json"

def load_quotes():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

QUOTES = load_quotes()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/quotes", methods=["GET"])
def get_quotes():
    """
    Search and filter quotes by author, search query, or category.
    Query parameters:
      - search: string to match against quote text or author (case-insensitive)
      - author: string to match against author name (case-insensitive)
      - category: exact match against category name (case-insensitive)
    """
    search = request.args.get("search", "").strip().lower()
    author = request.args.get("author", "").strip().lower()
    category = request.args.get("category", "").strip().lower()

    filtered = QUOTES

    if category and category != "all":
        filtered = [q for q in filtered if q.get("category", "").lower() == category]

    if author:
        filtered = [q for q in filtered if author in q.get("author", "").lower()]

    if search:
        filtered = [
            q for q in filtered
            if search in q.get("quote", "").lower() or search in q.get("author", "").lower()
        ]

    return jsonify({
        "total": len(filtered),
        "quotes": filtered
    })

@app.route("/api/quotes/random", methods=["GET"])
def get_random_quote():
    """
    Returns a random quote, optionally filtered by category or author.
    """
    category = request.args.get("category", "").strip().lower()
    author = request.args.get("author", "").strip().lower()

    candidates = QUOTES

    if category and category != "all":
        candidates = [q for q in candidates if q.get("category", "").lower() == category]

    if author:
        candidates = [q for q in candidates if author in q.get("author", "").lower()]

    if not candidates:
        return jsonify({"error": "No quotes found matching criteria"}), 404

    return jsonify(random.choice(candidates))

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Returns a sorted list of unique categories."""
    categories = sorted(list({q.get("category") for q in QUOTES if q.get("category")}))
    return jsonify(categories)

@app.route("/api/authors", methods=["GET"])
def get_authors():
    """Returns a sorted list of unique authors."""
    authors = sorted(list({q.get("author") for q in QUOTES if q.get("author")}))
    return jsonify(authors)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
