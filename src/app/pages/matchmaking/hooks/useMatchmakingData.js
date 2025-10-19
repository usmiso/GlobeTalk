"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "../../../firebase/auth";
import {
  fetchAvailableLanguages,
  fetchAvailableTimezones,
  requestMatch,
  createMatch,
} from "../lib/api";
import { filterByQuery, getLanguageLabel, getTimezoneLabel } from "../lib/utils";

export function useMatchmakingData() {
  const [timezones, setTimezones] = useState([]);
  const [timezone, setTimezone] = useState("");
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatType, setChatType] = useState("");
  const [proceeding, setProceeding] = useState(false);
  const [proceeded, setProceeded] = useState(false);
  const proceededRef = useRef(false);

  const timezoneOptionsRef = useRef(null);
  const languageOptionsRef = useRef(null);
  const [showTimezoneOptions, setShowTimezoneOptions] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  // Outside click close
  useEffect(() => {
    function handleClickOutside(event) {
      if (timezoneOptionsRef.current && !timezoneOptionsRef.current.contains(event.target)) {
        setShowTimezoneOptions(false);
      }
      if (languageOptionsRef.current && !languageOptionsRef.current.contains(event.target)) {
        setShowLanguageOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch lists
  useEffect(() => {
    (async () => {
      try {
        const [tzData, langData] = await Promise.all([
          fetchAvailableTimezones(),
          fetchAvailableLanguages(),
        ]);
        setTimezones(Array.isArray(tzData) ? tzData : []);
        setLanguages(Array.isArray(langData) ? langData : []);
      } catch {
        setTimezones([]);
        setLanguages([]);
      }
    })();
  }, []);

  // Keep a ref in sync with 'proceeded' so timers can read latest value
  useEffect(() => {
    proceededRef.current = proceeded;
  }, [proceeded]);

  const timezoneOptions = filterByQuery(timezones, timezoneSearch, getTimezoneLabel);
  const languageOptions = filterByQuery(languages, languageSearch, getLanguageLabel);

  async function handleFindMatch() {
    setLoading(true);
    setError("");
    setMatch(null);
    try {
      const user = auth.currentUser;
      if (!timezone && !selectedLanguage) {
        setError("Please select at least a timezone or a language to filter.");
        return;
      }
      const m = await requestMatch({
        timezone,
        language: selectedLanguage,
        excludeUserID: user?.uid,
      });
      setMatch(m);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToChat() {
    if (!auth.currentUser || !match?.userID) return;
    setProceeding(true);
    try {
      await createMatch({ userA: auth.currentUser.uid, userB: match.userID });
      setProceeded(true);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setProceeding(false);
    }
  }

  return {
    // lists and search
    timezones,
    timezone,
    setTimezone,
    timezoneSearch,
    setTimezoneSearch,
    timezoneOptions,
    showTimezoneOptions,
    setShowTimezoneOptions,
    timezoneOptionsRef,

    languages,
    selectedLanguage,
    setSelectedLanguage,
    languageSearch,
    setLanguageSearch,
    languageOptions,
    showLanguageOptions,
    setShowLanguageOptions,
    languageOptionsRef,

    // matchmaking state
    match,
    loading,
    error,
    chatType,
    setChatType,
    proceeding,
    proceeded,
  proceededRef,

    // actions
    handleFindMatch,
    handleProceedToChat,
    getTimezoneLabel,
    getLanguageLabel,
  };
}
