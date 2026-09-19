import { apiRequest } from "./apiClient";

export async function createInterview(
  token,
  interviewData,
  logout = null
) {
//   console.log("TOKEN SENT TO API:", token); 

  return apiRequest(
    "/interviews",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(interviewData),
    },
    logout
  );
}

export async function getInterviewQuestions(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/questions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}

export async function startInterview(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/start`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}

export async function getInterview(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}

export async function submitAnswer(
  token,
  interviewId,
  questionId,
  answerText,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/answers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interview_id: interviewId,
        question_id: questionId,
        answer_text: answerText,
      }),
    },
    logout
  );
}

export async function evaluateAnswer(
  token,
  interviewId,
  answerId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/evaluations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answer_id: answerId,
      }),
    },
    logout
  );
}

export async function completeInterview(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/complete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}

export async function getInterviewResult(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}/result`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}

export async function deleteInterview(
  token,
  interviewId,
  logout = null
) {
  return apiRequest(
    `/interviews/${interviewId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    logout
  );
}