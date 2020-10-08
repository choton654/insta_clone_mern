import axios from "axios";
import M from "materialize-css";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userContext } from "../context/userContext";

const Home = () => {
  const { state, dispatch } = useContext(userContext);
  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState([]);
  const css0 = { display: "none" };
  const css1 = { display: "block" };

  let user;
  state.user !== null
    ? (user = state.user)
    : (user = JSON.parse(localStorage.getItem("user")));
  const token = localStorage.getItem("jwt");
  const [comment, setComment] = useState("");
  useEffect(() => {
    getAllPosts();
    getAllUsers();
  }, []);

  const handleChange = async (query) => {
    setSearch(query);

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/search",
        { search },
        {
          headers: {
            Authorization: token && token,
          },
        }
      );
      setFoundUser(data.searchedUser);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllUsers = async () => {
    const { data } = await axios.get("http://localhost:5000/api/allUsers");
    // console.log(data.allUser);
    dispatch({ type: "ALL_USERS", payload: data.allUser });
  };

  const getAllPosts = async () => {
    const { data } = await axios.get("http://localhost:5000/api/allposts");
    // console.log(data.allPosts);
    dispatch({ type: "GET_ALL_POSTS", payload: data.allPosts });
  };

  const likePost = async (id) => {
    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/like`,
        { id: id },
        {
          headers: {
            Authorization: token && token,
          },
        }
      );
      console.log(data);
      const newOne = state.posts.map((post) => {
        if (post._id === data._id) {
          return data;
        } else {
          return post;
        }
      });
      console.log(newOne);
      dispatch({ type: "POST_LIKED", payload: newOne });
    } catch (error) {
      console.log(error);
    }
  };
  const unlikePost = async (id) => {
    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/unlike`,
        { id: id },
        {
          headers: {
            Authorization: token && token,
          },
        }
      );
      console.log(data);
      const newOne = state.posts.map((post) => {
        if (post._id === data._id) {
          return data;
        } else {
          return post;
        }
      });
      dispatch({ type: "POST_UNLIKED", payload: newOne });
    } catch (error) {
      console.log(error);
    }
  };
  const handleSubmit = async (e, id) => {
    e.preventDefault();
    console.log(id);
    const { data } = await axios.put(
      "http://localhost:5000/api/comment",
      { id: id, text: comment },
      {
        headers: {
          Authorization: token && token,
        },
      }
    );
    if (data.msg) {
      console.log(data.msg);
    } else {
      console.log(data.newComment);
      const newOne = state.posts.map((post) => {
        if (post._id === data.newComment._id) {
          return data.newComment;
        } else {
          return post;
        }
      });
      console.log(newOne);
      dispatch({ type: "COMMENT_POST", payload: newOne });
      setComment("");
    }
  };
  const deletePost = async (id) => {
    try {
      const { data } = await axios.delete(
        `http://localhost:5000/api/${id}/delete`,
        {
          headers: {
            Authorization: token && token,
          },
        }
      );
      console.log(data.success);
      dispatch({ type: "POST_DELETE", payload: id });
      M.toast({ html: data.success });
    } catch (error) {
      console.log(error);
    }
  };
  const deleteComment = async (postId, commentId) => {
    console.log(postId, commentId);
    console.log(token);
    try {
      const { data } = await axios.delete(
        `http://localhost:5000/api/${postId}/${commentId}/deletecomment`,
        {
          headers: {
            Authorization: token && token,
          },
        }
      );
      console.log(data);
      M.toast({ html: data.success });
      dispatch({
        type: "DELETE_COMMENT",
        payload: { post: data.post, comment: commentId },
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="row" style={{ backgroundColor: "lightsalmon" }}>
      <div className="col s12 l9">
        {state.posts.map((post, i) => (
          <div
            className="comtainer z-depth-4"
            style={{
              maxWidth: "800px",
              margin: "50px auto",
              backgroundColor: "#8d8ebc",
              padding: "10px",
            }}
            key={i}
          >
            <div style={{ backgroundColor: "whitesmoke" }} className="card">
              <div style={{ display: "flex", alignItems: "center" }}>
                <img
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "80px",
                    margin: "10px",
                  }}
                  src={post.postedBy.photo}
                />
                <Link
                  to={
                    user?._id === post.postedBy._id
                      ? "/profile"
                      : `/profile/${post.postedBy._id}`
                  }
                >
                  <strong
                    style={{ paddingLeft: "20px", color: "darkmagenta" }}
                    className="card-title"
                  >
                    {post.postedBy.username}
                  </strong>
                </Link>
              </div>
              <div className="card-image">
                <div className="parallax">
                  <img
                    style={{ paddingBottom: "10px" }}
                    src={post.photo}
                    width="650"
                    alt="no-image"
                  />
                </div>
              </div>
              <div>
                <i
                  style={{
                    paddingLeft: "20px",
                    color: "red",
                    cursor: "pointer",
                  }}
                  className="material-icons"
                >
                  favorite
                </i>
                {post.likes?.includes(user?._id) ? (
                  <i
                    onClick={() => unlikePost(post?._id)}
                    style={{
                      paddingLeft: "20px",
                      cursor: "pointer",
                      color: "blueviolet",
                    }}
                    className="material-icons"
                  >
                    thumb_down
                  </i>
                ) : (
                  <i
                    onClick={() => likePost(post?._id)}
                    style={{
                      paddingLeft: "20px",
                      cursor: "pointer",
                      color: "blueviolet",
                    }}
                    className="material-icons"
                  >
                    thumb_up
                  </i>
                )}
                {post.postedBy._id === user?._id && (
                  <i
                    onClick={() => deletePost(post?._id)}
                    style={{
                      paddingRight: "20px",
                      cursor: "pointer",
                      float: "right",
                    }}
                    className="material-icons"
                  >
                    delete
                  </i>
                )}
              </div>
              <div className="card-content">
                {post.likes.length} likes
                <h5>{post.body}</h5>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignContent: "center",
                  }}
                >
                  <div>
                    {post.comments?.map((comment) => (
                      <div
                        className="collection"
                        key={comment._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          backgroundColor: "lightblue",
                        }}
                      >
                        <div
                          className="collection-item"
                          style={{ backgroundColor: "lightblue" }}
                        >
                          <strong>{comment.postedBy?.username}</strong>
                          {"    "}:{"   "}
                          {comment.text}
                        </div>
                        {comment.postedBy?._id === user?._id && (
                          <i
                            style={{ marginLeft: "20px" }}
                            onClick={() =>
                              deleteComment(post?._id, comment._id)
                            }
                            style={{
                              paddingRight: "20px",
                              paddingTop: "15px",
                              cursor: "pointer",
                              float: "right",
                              color: "coral",
                            }}
                            className="tiny material-icons"
                          >
                            delete
                          </i>
                        )}
                      </div>
                    ))}
                  </div>

                  <form
                    style={{ backgroundColor: "#8d8ebc", marginTop: "20px" }}
                    onSubmit={(e) => handleSubmit(e, post._id)}
                    className="input-field col s6"
                  >
                    <i
                      className="tiny material-icons prefix"
                      style={{ color: "white" }}
                    >
                      chat
                    </i>
                    <input
                      className="materialize-input"
                      name="comment"
                      onChange={(e) => setComment(e.target.value)}
                      value={comment}
                      required
                      placeholder="Comment here"
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        className="col s12 l3"
        style={{
          // paddingRight: "30px",
          // paddingLeft: "30px",
          // paddingTop: "30px",
          padding: "30px",
          position: "fixed",
          right: 0,
          backgroundColor: "lightsalmon",
        }}
      >
        <nav style={{ backgroundColor: "darkcyan" }}>
          <div className="nav-wrapper">
            <div className="input-field">
              <input
                id="sch"
                type="search"
                required
                name="search"
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="search user"
              />
              <label className="label-icon" htmlFor="sch">
                <i className="material-icons">search</i>
              </label>
              <i className="material-icons">close</i>
            </div>
          </div>
        </nav>

        <div className="collection" style={search === "" ? css0 : css1}>
          {foundUser.map((founduser) => (
            <Link
              to={
                user?._id === founduser._id
                  ? "/profile"
                  : `/profile/${founduser._id}`
              }
              className="collection-item"
            >
              {founduser.username}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;

//
{
  /* <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            paddingLeft: "10px",
          }}
        >
          <h5 style={{ paddingLeft: "10px" }}>People you may know</h5>
          {state.users.map((otheruser) => (
            <div key={otheruser._id} style={{ display: "flex" }}>
              <img
                src={otheruser.photo}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "80px",
                  margin: "10px",
                }}
              />
              <Link
                to={
                  user?._id === otheruser._id
                    ? "/profile"
                    : `/profile/${otheruser._id}`
                }
              >
                <strong className="col s12">
                  <h6>{otheruser.username}</h6>
                </strong>
              </Link>
            </div>
          ))}
        </div> */
}
