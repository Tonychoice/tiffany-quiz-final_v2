import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// 1) Paste your Firebase web app config below.
// 2) Keep the field names exactly as-is.

const firebaseConfig = {
  apiKey: "AIzaSyAvfsS1IqFp2VM3hAnIx0W63V5l1ZDiKwo",
  authDomain: "tiff50.firebaseapp.com",
  projectId: "tiff50",
  storageBucket: "tiff50.firebasestorage.app",
  messagingSenderId: "146843438781",
  appId: "1:146843438781:web:09057dbc43f120ff8d31d4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GAME_ID = "tiffany-50";
const JOIN_PASSWORD = "fab50";
const ADMIN_PIN = "5050";

const QUESTION_SECONDS = 20;
const CORRECT_BASE_POINTS = 500;
const SPEED_BONUS_POINTS = 500;
const WRONG_PENALTY = -200;

const questions = [
  {
    id: "q1",
    text: "If Tiff could only wear one designer for the rest of her life, who would it be?",
    options: ["Alo", "Gucci", "Louis Vuitton", "Nike", "Zara"],
    correctIndex: 0,
  },
  {
    id: "q2",
    text: "If Tiff could live anywhere for a year, where would she go?",
    options: ["New York", "Miami", "Los Angeles", "Manila"],
    correctIndex: 2,
  },
  {
    id: "q3",
    text: "Back in the day, which spot would Tiff most likely be found clubbing?",
    options: ["Guvernment", "Phoenix", "Fluid", "Tonic", "Studio 69"],
    correctIndex: 2,
  },
  {
    id: "q4",
    text: "It’s Sunday night and Tiff is relaxing on the couch. What is she most looking forward to?",
    options: ["Watching Black-themed rom-coms", "Instagram rabbit hole", "Reading erotica"],
    correctIndex: 2,
  },
  {
    id: "q5",
    text: "What gym did Tiff work at back in the 2000's?",
    options: ["GoodLife", "Curzons Fitness", "Gold's Gym", "Premier Fitness"],
    correctIndex: 1,
  },
  {
    id: "q6",
    text: "Tiff is most likely to be mistaken for what ethnicity?",
    options: ["Middle Eastern", "Chinese", "Spanish", "Indian"],
    correctIndex: 3,
  },
  {
    id: "q7",
    text: "If you were going to set Tiff up on a date, who would she pick?",
    options: ["Boris Kodjoe", "Brad Pitt", "Idris Elba", "Morris Chestnut"],
    correctIndex: 2,
  },
  {
    id: "q8",
    text: "What was Tiff most likely to order from a West Indian restaurant?",
    options: ["Oxtail", "Jerk Chicken", "Fried/BBQ Chicken","Ackee and Saltfish"],
    correctIndex: 2,
  },
  {
    id: "q9",
    text: "Finish Tiff's text: Babe - Nuelle and I have an appointment to ....",
    options: ["Get our nails done", "Get our lashes done", "Get a wax", "All of the above"],
    correctIndex: 3,
  },
  {
    id: "q10",
    text: "Who is the LAST person Tiff would want sharing an embarrassing story about her?",
    options: ["Tricia", "Leah", "Any one of her cousins", "Paul"],
    correctIndex: 3,
  },
];

function makePlayerId() {
  let id = window.localStorage.getItem("tiffanyQuizPlayerId");
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("tiffanyQuizPlayerId", id);
  }
  return id;
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(255,255,255,.18), transparent 28%), linear-gradient(135deg, #000, #111 45%, #262626)",
    color: "white",
    fontFamily: "Georgia, 'Times New Roman', serif",
    padding: 18,
    boxSizing: "border-box",
  },
  card: {
    maxWidth: 880,
    margin: "0 auto",
    padding: 26,
    border: "1px solid #c9c9c9",
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))",
    boxShadow: "0 24px 70px rgba(0,0,0,.55)",
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "1px solid #c9c9c9",
    background: "#111",
    color: "white",
    fontSize: 16,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "15px 18px",
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid #f2f2f2",
    background: "linear-gradient(180deg, #fff, #aaa)",
    color: "#000",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  },
  darkButton: {
    width: "100%",
    padding: "15px 18px",
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid #f2f2f2",
    background: "rgba(255,255,255,.08)",
    color: "white",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  },
  dangerButton: {
    width: "100%",
    padding: "15px 18px",
    marginTop: 12,
    borderRadius: 18,
    border: "1px solid #f2f2f2",
    background: "linear-gradient(180deg, #ef4444, #991b1b)",
    color: "white",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  },
  decoLine: {
    height: 1,
    background: "linear-gradient(90deg, transparent, #fff, #888, #fff, transparent)",
    margin: "18px 0",
  },
};

const defaultGame = {
  currentIndex: 0,
  showAnswer: false,
  startedAt: Date.now(),
  gameEnded: false,
  gameVersion: Date.now(),
};

export default function App() {
  const isHost = typeof window !== "undefined" && window.location.search.includes("host=true"); 
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [players, setPlayers] = useState([]);
  const [game, setGame] = useState(defaultGame);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [lastPoints, setLastPoints] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [adminPin, setAdminPin] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [hostMode, setHostMode] = useState(false);

  const currentQuestion = questions[game.currentIndex] || questions[0];
  const finished = game.currentIndex >= questions.length - 1;

  useEffect(() => {
    const gameRef = doc(db, "games", GAME_ID);

    const unsubGame = onSnapshot(gameRef, async (snap) => {
      if (!snap.exists()) {
        await setDoc(gameRef, defaultGame);
        return;
      }

      const incoming = snap.data();
      setGame({
        currentIndex: incoming.currentIndex ?? 0,
        showAnswer: incoming.showAnswer ?? false,
        startedAt: incoming.startedAt ?? Date.now(),
        gameEnded: incoming.gameEnded ?? false,
        gameVersion: incoming.gameVersion ?? Date.now(),
      });

      setSelected(null);
      setAnswered(false);
      setLastPoints(null);
    });

    const unsubPlayers = onSnapshot(collection(db, "games", GAME_ID, "players"), (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGame();
      unsubPlayers();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - game.startedAt) / 1000);
      setTimeLeft(Math.max(QUESTION_SECONDS - elapsed, 0));
    }, 250);

    return () => window.clearInterval(timer);
  }, [game.startedAt, game.currentIndex, game.gameVersion]);

  const leaderboard = useMemo(() => {
    return [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

  const currentPlayer = players.find((p) => p.id === playerId);
  const rank = leaderboard.findIndex((p) => p.id === playerId) + 1;

  async function joinGame() {
    if (!name.trim()) return;

    const id = makePlayerId();
    setPlayerId(id);

    await setDoc(
      doc(db, "games", GAME_ID, "players", id),
      {
        name: name.trim(),
        score: currentPlayer?.score ?? 0,
      },
      { merge: true }
    );

    setJoined(true);
  }

  async function answer(index) {
    if (answered || game.showAnswer || game.gameEnded || timeLeft <= 0) return;

    const answerId = `${game.gameVersion}_${currentQuestion.id}_${playerId}`;
    const answerRef = doc(db, "games", GAME_ID, "answers", answerId);

    const correct = index === currentQuestion.correctIndex;
    const speedBonus = Math.round((timeLeft / QUESTION_SECONDS) * SPEED_BONUS_POINTS);
    const points = correct ? CORRECT_BASE_POINTS + speedBonus : WRONG_PENALTY;

    await setDoc(answerRef, {
      playerId,
      questionId: currentQuestion.id,
      selectedIndex: index,
      correct,
      points,
      answeredAt: Date.now(),
    });

    await updateDoc(doc(db, "games", GAME_ID, "players", playerId), {
      score: increment(points),
    });

    setSelected(index);
    setAnswered(true);
    setLastPoints(points);
  }

  async function revealAnswer() {
    await setDoc(
      doc(db, "games", GAME_ID),
      {
        showAnswer: true,
        gameEnded: false,
        gameVersion: Date.now(),
      },
      { merge: true }
    );
  }

  async function nextQuestion() {
    if (finished) return;

    await setDoc(
      doc(db, "games", GAME_ID),
      {
        currentIndex: game.currentIndex + 1,
        showAnswer: false,
        gameEnded: false,
        startedAt: Date.now(),
        gameVersion: Date.now(),
      },
      { merge: true }
    );
  }

  async function resetGame() {
    const playersSnapshot = await getDocs(collection(db, "games", GAME_ID, "players"));
    const answersSnapshot = await getDocs(collection(db, "games", GAME_ID, "answers"));
    const batch = writeBatch(db);

    playersSnapshot.docs.forEach((playerDoc) => {
      batch.set(playerDoc.ref, { score: 0 }, { merge: true });
    });

    answersSnapshot.docs.forEach((answerDoc) => {
      batch.delete(answerDoc.ref);
    });

    batch.set(
      doc(db, "games", GAME_ID),
      {
        currentIndex: 0,
        showAnswer: false,
        gameEnded: false,
        startedAt: Date.now(),
        gameVersion: Date.now(),
      },
      { merge: true }
    );

    await batch.commit();
  }

  async function endGame() {
    await setDoc(
      doc(db, "games", GAME_ID),
      {
        gameEnded: true,
        showAnswer: true,
        gameVersion: Date.now(),
      },
      { merge: true }
    );
  }

  async function clearAllPlayers() {
    const playersSnapshot = await getDocs(collection(db, "games", GAME_ID, "players"));
    const answersSnapshot = await getDocs(collection(db, "games", GAME_ID, "answers"));
    const batch = writeBatch(db);

    playersSnapshot.docs.forEach((playerDoc) => batch.delete(playerDoc.ref));
    answersSnapshot.docs.forEach((answerDoc) => batch.delete(answerDoc.ref));

    batch.set(doc(db, "games", GAME_ID), defaultGame, { merge: true });
    await batch.commit();
  }

  function QuizView({ host = false }) {
    return (
      <section style={styles.card}>
        <p style={{ letterSpacing: 5, color: "#c9c9c9", margin: 0 }}>TIFFANY TRIVIA</p>
        <h1 style={{ fontSize: host ? 58 : 38, margin: "10px 0 0" }}>50 & Fabulous</h1>
        <div style={styles.decoLine} />

        {game.gameEnded ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <h2 style={{ fontSize: host ? 58 : 36, color: "#60A5FA" }}>Game Over</h2>
            <p style={{ color: "#c9c9c9", fontFamily: "Arial, sans-serif" }}>
              Thanks for playing! Check the leaderboard for final scores.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <strong>Question {game.currentIndex + 1} of {questions.length}</strong>
              <strong style={{ fontSize: host ? 48 : 28 }}>{timeLeft}s</strong>
            </div>

            <h2 style={{ fontSize: host ? 50 : 30, lineHeight: 1.18, color: "#60A5FA" }}>
              {currentQuestion.text}
            </h2>

            {currentQuestion.options.map((option, index) => {
              const isCorrect = game.showAnswer && index === currentQuestion.correctIndex;
              const isWrong = answered && selected === index && index !== currentQuestion.correctIndex;

              return (
                <button
                  key={option}
                  onClick={() => answer(index)}
                  disabled={host || answered || game.showAnswer || timeLeft <= 0}
                  style={{
                    ...styles.darkButton,
                    background: isCorrect
                      ? "#0f8f68"
                      : isWrong
                      ? "#b91c1c"
                      : "rgba(255,255,255,.08)",
                    textAlign: "left",
                    fontSize: host ? 25 : 17,
                    cursor: host || answered || game.showAnswer || timeLeft <= 0 ? "default" : "pointer",
                  }}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                </button>
              );
            })}

            {(answered || game.showAnswer || timeLeft <= 0) && !host && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 18,
                  border: "1px solid #c9c9c9",
                  background: "rgba(255,255,255,.08)",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {answered && lastPoints !== null && (
                  <p style={{ margin: 0 }}>
                    {lastPoints > 0 ? "Correct!" : "Not quite."} <strong>{lastPoints > 0 ? `+${lastPoints}` : lastPoints}</strong> points
                  </p>
                )}
                {timeLeft <= 0 && !answered && <p>Time is up.</p>}
                {game.showAnswer && (
                  <p>
                    Correct answer: <strong>{currentQuestion.options[currentQuestion.correctIndex]}</strong>
                  </p>
                )}
              </div>
            )}

            {game.showAnswer && host && (
              <h3 style={{ color: "#c9c9c9", fontSize: 30 }}>
                Correct answer: <span style={{ color: "white" }}>{currentQuestion.options[currentQuestion.correctIndex]}</span>
              </h3>
            )}
          </>
        )}
      </section>
    );
  }

  function Leaderboard({ large = false }) {
    return (
      <section style={{ ...styles.card, marginTop: 20 }}>
        <h2 style={{ fontSize: large ? 38 : 28, marginTop: 0 }}>Leaderboard</h2>

        {!large && (
          <p style={{ color: "#c9c9c9", fontFamily: "Arial, sans-serif" }}>
            Your score: <strong style={{ color: "white" }}>{currentPlayer?.score || 0}</strong>
            {rank ? ` • Rank #${rank}` : ""}
          </p>
        )}

        {leaderboard.length === 0 ? (
          <p style={{ color: "#c9c9c9" }}>Waiting for players...</p>
        ) : (
          leaderboard.slice(0, large ? 8 : 20).map((player, index) => (
            <div
              key={player.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: large ? "16px 18px" : "11px 13px",
                borderRadius: 14,
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,.25)",
                background: index === 0 ? "linear-gradient(180deg, #fff, #aaa)" : "rgba(255,255,255,.1)",
                color: index === 0 ? "black" : "white",
                fontFamily: "Arial, sans-serif",
                fontSize: large ? 24 : 16,
              }}
            >
              <span>{index + 1}. {player.name}</span>
              <strong>{player.score || 0}</strong>
            </div>
          ))
        )}
      </section>
    );
  }

  if (!unlocked) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, marginTop: 80 }}>
          <p style={{ letterSpacing: 5, color: "#c9c9c9", margin: 0 }}>PRIVATE PARTY QUIZ</p>
          <h1 style={{ fontSize: 42 }}>Tiffany Trivia</h1>
          <div style={styles.decoLine} />
          <p style={{ color: "#c9c9c9" }}>Enter the party password.</p>
          <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button style={styles.button} onClick={() => setUnlocked(password === JOIN_PASSWORD)}>
            Enter
          </button>
        </div>
      </main>
    );
  }

  if (!joined) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, marginTop: 80 }}>
          <p style={{ letterSpacing: 5, color: "#c9c9c9", margin: 0 }}>50 & FABULOUS</p>
          <h1 style={{ fontSize: 42 }}>Tiffany Trivia</h1>
          <div style={styles.decoLine} />
          <input style={styles.input} placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          <button style={styles.button} onClick={joinGame}>
            Join Game
          </button>
        </div>
      </main>
    );
  }

  if (hostMode) {
    return (
      <main style={styles.page}>
        <QuizView host />
        <Leaderboard large />
        <section style={{ ...styles.card, marginTop: 20 }}>
          <button style={styles.darkButton} onClick={() => setHostMode(false)}>
            Exit Host Screen
          </button>
          <button style={styles.button} onClick={revealAnswer}>
            Reveal Answer
          </button>
          <button style={{ ...styles.button, opacity: finished ? 0.5 : 1 }} disabled={finished} onClick={nextQuestion}>
            Next Question
          </button>
          <button style={styles.dangerButton} onClick={endGame}>
            End Game For Everyone
          </button>
          <button style={styles.darkButton} onClick={resetGame}>
            Reset Game + Scores
          </button>
          <button style={styles.dangerButton} onClick={clearAllPlayers}>
            Clear Players + Start Fresh
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <QuizView />
      <Leaderboard />
      {isHost && (
      <section style={{ ...styles.card, marginTop: 20 }}>
        <h2>Admin Controls</h2>
        <p style={{ color: "#c9c9c9", fontFamily: "Arial, sans-serif" }}>Host controls question pacing. PIN required.</p>
        {!adminUnlocked ? (
          <>
            <input style={styles.input} type="password" placeholder="Admin PIN" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} />
            <button style={styles.button} onClick={() => setAdminUnlocked(adminPin === ADMIN_PIN)}>
              Unlock Admin
            </button>
          </>
        ) : (
          <>
            <button style={styles.darkButton} onClick={() => setHostMode(true)}>
              Open Host Screen
            </button>
            <button style={styles.button} onClick={revealAnswer}>
              Reveal Answer
            </button>
            <button style={{ ...styles.button, opacity: finished ? 0.5 : 1 }} disabled={finished} onClick={nextQuestion}>
              Next Question
            </button>
            <button style={styles.dangerButton} onClick={endGame}>
              End Game For Everyone
            </button>
            <button style={styles.darkButton} onClick={resetGame}>
              Reset Game + Scores
            </button>
            <button style={styles.dangerButton} onClick={clearAllPlayers}>
              Clear Players + Start Fresh
            </button>
          </>
        )}
      </section>
      )}
    </main>
  );
}
