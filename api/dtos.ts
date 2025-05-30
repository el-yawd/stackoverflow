export interface QuestionDTO {
    is_answered: boolean;
    view_count: number;
    answer_count: number;
    score: number;
    title: string;
    link: string;
    creation_date: string;
    question_id: number;
    tags: string[];
    owner: OwnerDTO;
}

export interface OwnerDTO {
    user_id: number;
    reputation: number;
    display_name: string;
    link: string;
}

export interface APIResponse<T> {
    items: T[];
    has_more: boolean;
    quota_max: number;
    quota_remaining: number;
}