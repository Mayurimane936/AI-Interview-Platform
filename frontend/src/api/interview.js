const API_URL = "http://127.0.0.1:8000";

export async function createInterview(token, interviewData) {
    console.log("TOKEN SENT TO API:", token);

    const response = await fetch(`${API_URL}/interviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
    });

    const data = await response.json();

    console.log("CREATE INTERVIEW RESPONSE:", data);

    if (!response.ok) {
        throw new Error(
            data.detail || data.message || "Failed to create interview"
        );
    }

    return data;
}

export async function getInterviewQuestions(token, interviewId) {
    const response = await fetch(
        `${API_URL}/interviews/${interviewId}/questions`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || data.message || "Failed to fetch questions"
        );
    }

    return data;
}

export async function startInterview(token, interviewId) {
    const response = await fetch(
        `${API_URL}/interviews/${interviewId}/start`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || data.message || "Failed to start interview"
        );
    }

    return data;
}

export async function getInterview(token, interviewId) {
    const response = await fetch(
        `${API_URL}/interviews/${interviewId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || data.message || "Failed to fetch interview"
        );
    }

    return data;
}

export async function submitAnswer(
    token,
    interviewId,
    questionId,
    answerText
) {
    const response = await fetch(
        `${API_URL}/interviews/${interviewId}/answers`,
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
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            "Failed to submit answer"
        );
    }

    return data;
}

export async function evaluateAnswer(token, interviewId, answerId) {
  const response = await fetch(
    `${API_URL}/interviews/${interviewId}/evaluations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answer_id: answerId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "Failed to evaluate answer"
    );
  }

  return data;
}

export async function completeInterview(token, interviewId) {
  const response = await fetch(
    `${API_URL}/interviews/${interviewId}/complete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "Failed to complete interview"
    );
  }

  return data;
}