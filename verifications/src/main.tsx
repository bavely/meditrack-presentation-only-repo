import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_API_URL,
  credentials: 'include',
});
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ApolloProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>,
  );
} else {
  throw new Error("Root element with id 'root' not found");
}
