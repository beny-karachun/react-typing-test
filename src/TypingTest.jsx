import React, { useState, useEffect, useRef, useCallback } from "react";
import "./TypingTest.css"; // Ensure CSS is imported

const defaultLtrText =
  "This is a sample text for LTR typing. Use arrows/click to navigate. Backspace deletes. Restart or change the text using the buttons.";
const defaultRtlText =
  "זהו טקסט לדוגמה להקלדה מימין לשמאל. השתמש בחצים/קליק לניווט. Backspace מוחק. הפעל מחדש או שנה את הטקסט באמצעות הכפתורים."; // Example Hebrew

function TypingTest() {
  // Directionality state
  const [direction, setDirection] = useState('ltr'); // 'ltr' or 'rtl'
  const [refText, setRefText] = useState(defaultLtrText);

  // UI state
  const [showTextInput, setShowTextInput] = useState(false);
  const [newText, setNewText] = useState("");
  const [textInputFocused, setTextInputFocused] = useState(false);

  // Core input state
  const [inputArr, setInputArr] = useState([]);
  const [cursor, setCursor] = useState(0);

  // Timing state
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Ref for scrolling/focus
  const topContainerRef = useRef(null);

  // --- Helper Functions ---

  // Reset function
  const handleReset = useCallback(() => {
    setInputArr([]);
    setCursor(0);
    setStartTime(null);
    setCurrentTime(Date.now());
    if (topContainerRef.current) {
      topContainerRef.current.focus();
    }
    setShowTextInput(false);
    // DO NOT reset direction here, keep user's choice
  }, []); // Add direction if it should also reset, but likely shouldn't

  // Toggle Direction
  const toggleDirection = () => {
    const newDirection = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    // Optionally, change default text when toggling if no user text is set
    // This check prevents overwriting user-set text just by toggling direction
    if (refText === defaultLtrText && newDirection === 'rtl') {
        setRefText(defaultRtlText)
    } else if (refText === defaultRtlText && newDirection === 'ltr') {
        setRefText(defaultLtrText)
    }
    handleReset(); // Reset progress when direction changes
  };

  // --- Key Handling ---
  const handleKeyDown = useCallback(
    (e) => {
      if (textInputFocused) return;

      const isRTL = direction === 'rtl';

      // --- Arrow Keys (Simple Movement) ---
      if (!e.ctrlKey && !e.metaKey) {
        // Left Arrow
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (isRTL) { // RTL: Left arrow moves visually right (increases index)
            if (cursor < refText.length) setCursor(cursor + 1);
          } else { // LTR: Left arrow moves visually left (decreases index)
            if (cursor > 0) setCursor(cursor - 1);
          }
          return;
        }
        // Right Arrow
        if (e.key === "ArrowRight") {
          e.preventDefault();
           if (isRTL) { // RTL: Right arrow moves visually left (decreases index)
             if (cursor > 0) setCursor(cursor - 1);
           } else { // LTR: Right arrow moves visually right (increases index)
             if (cursor < refText.length) setCursor(cursor + 1);
           }
          return;
        }
        // Up/Down Arrows (geometry based, less affected by direction)
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const candidate = findVerticalCandidate(-1);
          setCursor(candidate);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const candidate = findVerticalCandidate(1);
           if (candidate === cursor && cursor < refText.length) {
             setCursor(refText.length);
           } else if (candidate !== cursor) {
             setCursor(candidate);
           }
          return;
        }
      }

      // --- Ctrl/Meta + Arrow Keys (Word Jumps) ---
      const moveLeftAction = () => { // Logic for moving one word left (decreasing index)
          let newIndex = cursor;
          while (newIndex > 0 && /\s/.test(refText[newIndex - 1])) newIndex--;
          while (newIndex > 0 && !/\s/.test(refText[newIndex - 1])) newIndex--;
          setCursor(newIndex);
      };
      const moveRightAction = () => { // Logic for moving one word right (increasing index)
          let newIndex = cursor;
          while (newIndex < refText.length && !/\s/.test(refText[newIndex])) newIndex++;
          while (newIndex < refText.length && /\s/.test(refText[newIndex])) newIndex++;
          setCursor(newIndex);
      };

      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          isRTL ? moveRightAction() : moveLeftAction(); // RTL: Left arrow jumps visually right (increase index)
          return;
      }
      if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          isRTL ? moveLeftAction() : moveRightAction(); // RTL: Right arrow jumps visually left (decrease index)
          return;
      }

      // --- Deletion Keys (Logic is independent of direction) ---
      // Control+Backspace
      if (e.key === "Backspace" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        let deleteToIndex = cursor;
        while (deleteToIndex > 0 && /\s/.test(refText[deleteToIndex - 1])) deleteToIndex--;
        while (deleteToIndex > 0 && !/\s/.test(refText[deleteToIndex - 1])) deleteToIndex--;

        if (deleteToIndex < cursor) {
          const newArr = [...inputArr];
          for (let j = deleteToIndex; j < cursor; j++) newArr[j] = undefined;
          setInputArr(newArr);
          setCursor(deleteToIndex);
        }
        return;
      }

      // Normal Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        if (cursor > 0) {
          const newArr = [...inputArr];
          newArr[cursor - 1] = undefined;
          setInputArr(newArr);
          setCursor(cursor - 1);
        }
        return;
      }

      // --- Character Input ---
      if (e.key === " ") e.preventDefault(); // Prevent space scroll

      let ch = "";
      if (e.key === "Enter") ch = "\n";
      else if (e.key.length === 1) ch = e.key;
      else return; // Ignore non-character keys

      // Start timer
      if (!startTime && cursor < refText.length && ch.length === 1) {
        setStartTime(Date.now());
        setCurrentTime(Date.now());
      }

      // Update input
      if (cursor < refText.length) {
        const newArr = [...inputArr];
        newArr[cursor] = ch;
        setInputArr(newArr);
        setCursor(cursor + 1);
      }
    },
    [
        textInputFocused,
        cursor,
        inputArr,
        refText,
        startTime,
        direction // Add direction as dependency
    ]
  );

  // Find vertical candidate (geometry-based, should work mostly okay)
  const findVerticalCandidate = (vertDirection) => {
      if (!topContainerRef.current) return cursor;
      const spans = topContainerRef.current.querySelectorAll("span[data-index]");
      if (spans.length === 0) return cursor;

      const currentSpan = topContainerRef.current.querySelector(`span[data-index="${cursor}"]`);
      const referenceSpan = currentSpan || spans[spans.length - 1];
      if (!referenceSpan) return cursor;

      const currentRect = referenceSpan.getBoundingClientRect();
      let candidateIndex = cursor;
      let bestDiffY = Infinity;
      let bestDiffX = Infinity;
      const targetLineTop = vertDirection === -1 ? currentRect.top - 10 : currentRect.top + 10;

      spans.forEach((span) => {
          const index = parseInt(span.getAttribute('data-index'), 10);
          const rect = span.getBoundingClientRect();
          const verticalMatch = (vertDirection === -1 && rect.top < currentRect.top) || (vertDirection === 1 && rect.top > currentRect.top);

          if (verticalMatch) {
              const diffY = Math.abs(rect.top - targetLineTop);
              // Use rect.left for horizontal distance regardless of text direction,
              // as it's viewport-relative.
              const diffX = Math.abs(rect.left - currentRect.left);

              if (diffY < bestDiffY || (diffY === bestDiffY && diffX < bestDiffX)) {
                  bestDiffY = diffY;
                  bestDiffX = diffX;
                  candidateIndex = index;
              }
          }
      });
      return candidateIndex;
  };

  // --- Effects ---

  // Attach key listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-scrolling
  useEffect(() => {
    if (topContainerRef.current) {
        const cursorSpan = topContainerRef.current.querySelector(`span[data-index="${cursor}"]`);
        const endCursorSpan = topContainerRef.current.querySelector('.cursor-end');
        const targetSpan = cursorSpan || (cursor >= refText.length ? endCursorSpan : null);

        if (targetSpan) {
            // 'nearest' helps keep it horizontally centered better in both LTR/RTL
            targetSpan.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    }
}, [cursor, refText, direction]); // Add direction dependency jic layout changes affect scroll target


  // Timer update
  useEffect(() => {
     if (!startTime) return;
     const intervalId = setInterval(() => {
        let correctCount = 0;
        for (let i = 0; i < refText.length; i++) {
            if (inputArr[i] !== undefined && inputArr[i] === refText[i]) {
                correctCount++;
            }
        }
        if (correctCount === refText.length && inputArr[refText.length - 1] === refText[refText.length - 1]) {
             clearInterval(intervalId);
             // Update time one last time potentially
             setCurrentTime(Date.now());
             return;
        }
       setCurrentTime(Date.now());
     }, 1000);
     return () => clearInterval(intervalId);
   }, [startTime, refText.length, inputArr]);


  // --- Event Handlers ---

  // Click on text
  const handleTopClick = (i) => {
    setCursor(i);
    if (topContainerRef.current) {
      topContainerRef.current.focus();
    }
  };

  // Submit new text
  const handleSetText = () => {
    setRefText(newText || (direction === 'ltr' ? defaultLtrText : defaultRtlText)); // Use appropriate default
    handleReset();
    setShowTextInput(false);
    setNewText("");
  };

  // --- Metrics Calculation ---
  const computeMetrics = () => {
    let correctCount = 0;
    let typedCount = 0;
    let finished = false;

    for (let i = 0; i < refText.length; i++) {
      if (inputArr[i] !== undefined) {
        typedCount++;
        if (inputArr[i] === refText[i]) correctCount++;
      }
    }

    if (correctCount === refText.length && inputArr[refText.length - 1] === refText[refText.length - 1]){
        finished = true;
    }

    const accuracy = typedCount > 0 ? (correctCount / typedCount) * 100 : 100;
    const elapsedMillis = startTime ? currentTime - startTime : 0;
    const elapsedMinutes = elapsedMillis / 60000;
    const wpm = elapsedMinutes > 0 ? (correctCount / 5) / elapsedMinutes : 0;
    const percentFinished = refText.length > 0 ? (correctCount / refText.length) * 100 : 0;

    return { accuracy, wpm, percentFinished, finished, elapsedMillis };
  };

  const { accuracy, wpm, percentFinished, finished, elapsedMillis } = computeMetrics();

  // --- Rendering ---

  const renderTopText = () => {
    const characters = refText.split("");
    const rendered = characters.map((char, i) => {
      let className = "";
      const typedChar = inputArr[i];
      if (typedChar !== undefined) {
        className = typedChar === char ? "correct" : "incorrect";
      }
      if (i === cursor) {
        className += " current";
      }
      const displayChar = char === '\n' ? '↵\n' : char;
      return (
        <span key={i} data-index={i} className={className} onClick={() => handleTopClick(i)}>
          {displayChar}
        </span>
      );
    });

    if (cursor >= characters.length) {
      rendered.push(<span key="cursor-end" className="cursor-end"> </span>);
    }
    return rendered;
  };

  const renderMetrics = () => {
    const timeFormatted = (elapsedMillis / 1000).toFixed(1);
    return (
      <div id="metricsContainer">
        <span>Time: {timeFormatted}s</span>
        <span>Accuracy: {accuracy.toFixed(1)}%</span>
        <span>WPM (Net): {wpm.toFixed(1)}</span>
        <span>Completed: {percentFinished.toFixed(1)}%</span>
        {finished && <span className="finished-indicator">Finished!</span>}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div className="header-buttons">
            <button onClick={() => setShowTextInput((prev) => !prev)}>
                {showTextInput ? "Cancel Change" : "Change Text"}
            </button>
            {/* Direction Toggle Button */}
            <button onClick={toggleDirection}>
                Direction: {direction.toUpperCase()}
            </button>
            <button onClick={handleReset} disabled={!startTime && cursor === 0}>
                Restart Test
            </button>
        </div>
        {/* Header Text */}
        <div className="header-text" dir={direction}> {/* Add dir here too if needed */}
          <h1>Typing Test / מבחן הקלדה</h1>
          <p>
            {direction === 'ltr'
              ? 'Type the text below. Use arrows/click to navigate. Backspace deletes.'
              : 'הקלד את הטקסט למטה. השתמש בחצים/קליק לניווט. Backspace מוחק.'}
            <br />
            {direction === 'ltr'
              ? 'Ctrl/Cmd+Arrows for word jump, Ctrl/Cmd+Backspace for word delete.'
              : 'Ctrl/Cmd+חצים לקפיצה בין מילים, Ctrl/Cmd+Backspace למחיקת מילה.'}
          </p>
        </div>
        {/* Text Input Area */}
        {showTextInput && (
          <div className="text-input">
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={direction === 'ltr' ? "Paste LTR text..." : "...הדבק טקסט RTL"}
              onFocus={() => setTextInputFocused(true)}
              onBlur={() => setTextInputFocused(false)}
              rows={10}
              dir={direction} // Apply direction to textarea
            />
            <button onClick={handleSetText}>Set Text & Restart</button>
          </div>
        )}
      </div>
      <div className="content">
        {/* Main Text Container */}
        <div
          id="fullTextContainer"
          ref={topContainerRef}
          tabIndex={-1}
          onClick={() => topContainerRef.current?.focus()}
          dir={direction} // Set text direction
          className={direction} // Add class 'ltr' or 'rtl' for CSS rules
        >
          {renderTopText()}
        </div>
        {/* Metrics */}
        {renderMetrics()}
      </div>
    </div>
  );
}

export default TypingTest;