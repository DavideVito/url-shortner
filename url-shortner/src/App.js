import { useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import "./App.css";

function App() {
  const [link, linkInput] = useInput({
    type: "text",
    className: "input is-primary",
  });
  const [chiave, chaveInput] = useInput({
    type: "text",
    className: "input is-secondary",
  });
  const [ogg, cambiaOgg] = useState("");
  const [info, cambiaInfo] = useState("");

  const handleClick = async () => {
    let url = link;

    if (link === "") {
      alert("no link");
      return;
    }

    const ris = await fetch("/url", {
      method: "post",
      body: JSON.stringify({ url }),
      headers: { "content-type": "application/json" },
    });

    const json = await ris.json();

    cambiaOgg(json);
  };

  const getInfo = async () => {
    if (chiave === "") {
      alert("no key");
      return;
    }

    const res = await fetch("/info/" + chiave);

    const json = await res.json();

    cambiaInfo(json);
  };

  return (
    <div className="App" style={{ marginTop: "25px" }}>
      <section className="hero">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">URL Shortner</h1>
            <h2 className="subtitle">Fast, easy and i dont think reliable</h2>
          </div>
        </div>
      </section>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {linkInput}
        <div className="control">
          <button className="button is-link" onClick={handleClick}>
            Submit
          </button>
        </div>
      </form>

      {ogg ? (
        <div>
          <a href={ogg.chiave}> {window.location.href + ogg.chiave}</a>

          <CopyToClipboard
            text={window.location.href + ogg.chiave}
            onCopy={() => {
              console.log("Copiato");
            }}
          >
            <div className="control">
              <button className="button is-link">
                Copy <i>{window.location.href + ogg.chiave}</i> clipboard
              </button>
            </div>
          </CopyToClipboard>
        </div>
      ) : (
        <></>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        style={{ marginTop: "25px" }}
      >
        {chaveInput}
        <div className="control">
          <button className="button is-link" onClick={getInfo}>
            Get Info
          </button>
        </div>
      </form>

      {info ? (
        <div>
          <div className="columns is-mobile">
            <div className="column">Link</div>
            <div className="column">Key</div>
            <div className="column">Click</div>
          </div>
          <div className="columns is-mobile">
            <div className="column">{info.url}</div>
            <div className="column">{info.chiave}</div>
            <div className="column">{info.click}</div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

function useInput({ type, className }) {
  const [value, setValue] = useState("");
  const input = (
    <div className="field">
      <div className="control">
        <input
          className={className}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type={type}
        />
      </div>
    </div>
  );
  return [value, input];
}

export default App;
