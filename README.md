# Stanford CS 52 X Planet Labs Project Centinella 

Planet Labs Provides it’s subscribers with cutting edge and powerful satellite imagery for use in conservation projects. Our platform hopes to make this powerful data accessible for a variety of users from conservationists to policy makers with their own unique use-cases and skill sets. Conservation has never been so easy.

## Quick Start

### Prerequisites

 - [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- [Git](https://git-scm.com/)
- Accounts and API keys for:
  - [Anthropic](https://console.anthropic.com)
  - [E2B](https://e2b.dev)
  - [Google AI](https://aistudio.google.com)
  - [SerpAPI](https://serpapi.com)
  - [Convex](https://dashboard.convex.dev)

### Installation
Clone Repository
```bash
git clone <https://github.com/elnukk/planet-agent.git>
cd planet-agent
```

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install our pip dependencies
```
pip install -r requirements.txt
```
Install Node Dependencies
```
npm install
```




### Running Our Project Locally

Set Up Environmental Variables

```
ANTHROPIC_API_KEY=your_anthropic_api_key
E2B_API_KEY=your_e2b_api_key
GOOGLE_API_KEY=your_google_api_key
SERPAPI_KEY=your_serpapi_key
```

#### Run 3 Terminals

Database(convex)
```
npx convex dev
```

Front End (Node.js)
```
npm run dev
```

Python API (server)
```
cd knowledge-base
uvicorn api_server:app --reload
```

## Usage

Open local host http://localhost:3000 in your browser.



## Contributors

- Elanu Karakus (TA)
- David Tomz
- Brandyn Lu
- Anya Pinto 
- Jolie Teo
- Vanesska Hall





## Acknowledgements

We would like to thank planet labs’s Amy Wiesenthal and Seamus and a special thanks to the amazing organisations that are a part of project centinella that agreed to do needfinding interviews with us. 

## License

[MIT](https://choosealicense.com/licenses/mit/)
