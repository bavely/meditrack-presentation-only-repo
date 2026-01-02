import { gql } from '@apollo/client';



export const AI_ASSISTANT_QUERY = gql`
    mutation GetMedicationInfo($prompt: String!, $conversationId: String) {
        getMedicationInfo(prompt: $prompt, conversationId: $conversationId) {
            success
            errors {
                field
                message
            }
            data {
                conversationId
                title
                createdAt
                updatedAt
                messages {
                    id
                    role
                    content
                    timestamp
                }
            }
        }
    }       
`;

export const GET_AI_CONVERSATIONS = gql`
    query aiConversations {
        aiConversations {
            success
            errors {
                field
                message
            }
            data {
                conversationId
                title
                createdAt
                updatedAt
            }
        }
    }
`;

export const GET_AI_CONVERSATION = gql`
    query aiConversation($conversationId: String!) {
        aiConversation(conversationId: $conversationId) {
            success
            errors {
                field
                message
            }
            data {
                conversationId
                title
                createdAt
                updatedAt
                messages {
                    id
                    role
                    content
                    timestamp
                }
            }
        }
    }
`;

export const DELETE_CONVERSATION = gql`
    mutation deleteConversation($conversationId: String!) {
        deleteConversation(conversationId: $conversationId) {
            success
            errors {
                field
                message
            }
            data {
                conversationId
            }
        }
    }
`;
