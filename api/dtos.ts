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

export interface TagsDTO {
  name: string;
  count: number;
  is_required: boolean;
  is_moderator_only: boolean;
  has_synonyms: boolean;
}

export interface AnswerDTO {
  answer_id: number;
  body: string;
  creation_date: string;
  score: number | null;
  is_accepted: boolean;
  question_id: number | null;
  owner: OwnerDTO;
}

export interface OwnerDTO {
  user_id: number;
  reputation: number;
  display_name: string;
  link: string;
  user_type: string;
}

export interface APIResponse<T> {
  items: T[];
  has_more: boolean;
  quota_max: number;
  quota_remaining: number;
}

export interface CommentDTO {
  comment_id: number;
  body: string;
  creation_date: string;
  post_id: number | null;
  owner: OwnerDTO;
}
