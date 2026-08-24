import React from "react";
import { useForm } from "react-hook-form";
import GlobalNav from "../../components/GlobalNav";
import useUserUpdate from "../../hooks/useUserUpdate";
import UserUpdateForm from "../../components/user/UserUpdateForm";

export default function UserUpdatePage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const {
    loading,
    avatarPreview,
    handleAvatarChange,
    userName,
    setUserName,
    email,
    submitUpdate,
  } = useUserUpdate(reset);

  if (loading) return <GlobalNav/>;

  return (
    <div className="user-root">
      <GlobalNav/>

      <div className="user-update-page">
        <UserUpdateForm
          register={register}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          avatarPreview={avatarPreview}
          handleAvatarChange={handleAvatarChange}
          userName={userName}
          setUserName={setUserName}
          email={email}
          onSubmit={submitUpdate}
        />
      </div>
    </div>
  );
}
